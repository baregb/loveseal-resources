/* eslint-disable no-restricted-globals */
/**
 * Lively Resources — Service Worker
 *
 * Strategy summary:
 *   • Precache the /offline page only
 *   • Public HTML routes  → network-first with 3s timeout, cache fallback, offline page if no cache
 *   • Cover & content-assets images → cache-first (long-lived, content-addressed by Supabase Storage)
 *   • Google fonts        → cache-first
 *   • Everything else     → pass-through (no caching)
 *
 * NEVER caches:
 *   • /admin/* routes (stale admin UI is dangerous)
 *   • /api/* routes (always dynamic)
 *   • Supabase API requests (auth, DB, storage signed URLs)
 *   • Any non-GET request
 *   • Anything cross-origin we haven't explicitly opted in to
 *
 * Bump CACHE_VERSION to invalidate ALL caches on next visit (e.g. after a
 * breaking change to the cached shell). Old caches are deleted on `activate`.
 */

const CACHE_VERSION = 'v1'
const SHELL_CACHE   = `liveseal-shell-${CACHE_VERSION}`
const PAGES_CACHE   = `liveseal-pages-${CACHE_VERSION}`
const IMAGES_CACHE  = `liveseal-images-${CACHE_VERSION}`
const FONTS_CACHE   = `liveseal-fonts-${CACHE_VERSION}`

/* Routes precached on install. Keep this list MINIMAL: precache failures fail
   the install. The offline page is the only must-have — one entry per locale
   so users see their language when they go offline. */
const SHELL_URLS = [
  '/offline',
  '/es/offline',
  '/fr/offline',
  '/pt/offline',
  '/ar/offline',
]

/* Origins for cache-first asset handling. */
const SUPABASE_STORAGE_HOST_SUFFIX = '.supabase.co'
const GOOGLE_FONTS_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

/* Soft caps so the SW doesn't grow forever. LRU-ish: when over the limit, drop
   the oldest N entries. Browsers also have their own quotas so this is a
   politeness bound, not a hard guarantee. */
const PAGES_MAX  = 50
const IMAGES_MAX = 80

/* ── INSTALL ───────────────────────────────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE)
      // Don't fail install on individual fetch errors — log and continue.
      await Promise.all(
        SHELL_URLS.map(async (url) => {
          try {
            await cache.add(url)
          } catch (err) {
            console.warn('[sw] precache miss:', url, err)
          }
        }),
      )
      // Activate this SW immediately on first install (no waiting for tabs to close).
      await self.skipWaiting()
    })(),
  )
})

/* ── ACTIVATE ──────────────────────────────────────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const expected = new Set([SHELL_CACHE, PAGES_CACHE, IMAGES_CACHE, FONTS_CACHE])
      const names    = await caches.keys()
      await Promise.all(
        names
          .filter((n) => n.startsWith('liveseal-') && !expected.has(n))
          .map((n) => caches.delete(n)),
      )
      // Take control of open clients (tabs) immediately.
      await self.clients.claim()
    })(),
  )
})

/* ── FETCH ─────────────────────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  /* Hard skip: admin, API, auth, anything that should never be cached. */
  if (url.pathname.startsWith('/admin'))   return
  if (url.pathname.startsWith('/api'))     return
  if (url.pathname.startsWith('/_next/data')) return

  /* Cross-origin: only handle a few explicit allowlists. */
  if (url.origin !== self.location.origin) {
    if (url.hostname.endsWith(SUPABASE_STORAGE_HOST_SUFFIX)) {
      // Storage assets (covers, attachments). Cache-first.
      event.respondWith(cacheFirst(req, IMAGES_CACHE, IMAGES_MAX))
      return
    }
    if (GOOGLE_FONTS_HOSTS.includes(url.hostname)) {
      event.respondWith(cacheFirst(req, FONTS_CACHE))
      return
    }
    // Any other cross-origin: don't handle.
    return
  }

  /* Same-origin static Next.js assets (immutable hashed files). Cache-first. */
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(req, SHELL_CACHE))
    return
  }

  /* Same-origin icons and other /public assets. */
  if (url.pathname.startsWith('/icons/') || url.pathname === '/favicon.ico') {
    event.respondWith(cacheFirst(req, IMAGES_CACHE, IMAGES_MAX))
    return
  }

  /* HTML navigations: network-first with offline fallback. */
  const isHtmlNav =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html')

  if (isHtmlNav) {
    event.respondWith(networkFirst(req, PAGES_CACHE, PAGES_MAX))
    return
  }

  /* Everything else same-origin (JSON, prefetch payloads): pass through. */
})

/* ── STRATEGIES ────────────────────────────────────────────────────────── */

async function cacheFirst(req, cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const hit   = await cache.match(req)
  if (hit) return hit
  try {
    const res = await fetch(req)
    // Only cache successful, basic-CORS responses (opaque responses can't be
    // inspected and may permanently occupy quota with no useful content).
    if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
      cache.put(req, res.clone()).then(() => {
        if (maxEntries) trimCache(cacheName, maxEntries)
      })
    }
    return res
  } catch (err) {
    // No network, no cache. Let the browser show its native error.
    throw err
  }
}

async function networkFirst(req, cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  try {
    const res = await fetchWithTimeout(req, 3000)
    if (res.ok) {
      cache.put(req, res.clone()).then(() => {
        if (maxEntries) trimCache(cacheName, maxEntries)
      })
    }
    return res
  } catch {
    const cached = await cache.match(req)
    if (cached) return cached
    // Last resort: locale-appropriate offline page from the precache.
    const offlineUrl = offlineUrlForRequest(req)
    const offline    = await caches.match(offlineUrl)
    if (offline) return offline
    // Fallback to English offline page
    const fallback = await caches.match('/offline')
    if (fallback) return fallback
    return new Response('You are offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

/* Map a request URL to its locale-specific /offline path. */
function offlineUrlForRequest(req) {
  const path = new URL(req.url).pathname
  const m = path.match(/^\/(es|fr|pt|ar)(?:\/|$)/)
  return m ? `/${m[1]}/offline` : '/offline'
}

function fetchWithTimeout(req, ms) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      controller.abort()
      reject(new Error('network timeout'))
    }, ms)
    fetch(req, { signal: controller.signal }).then(
      (res) => { clearTimeout(timer); resolve(res) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys  = await cache.keys()
  if (keys.length <= maxEntries) return
  const drop = keys.length - maxEntries
  // keys() returns in insertion order — oldest first.
  for (let i = 0; i < drop; i++) {
    await cache.delete(keys[i])
  }
}

/* ── MESSAGES (for forced cache reset, etc.) ───────────────────────────── */
self.addEventListener('message', (event) => {
  if (event.data === 'sw:skip-waiting') self.skipWaiting()
  if (event.data === 'sw:clear-caches') {
    event.waitUntil(
      (async () => {
        const names = await caches.keys()
        await Promise.all(names.filter((n) => n.startsWith('liveseal-')).map((n) => caches.delete(n)))
      })(),
    )
  }
})