'use client'

import { useEffect } from 'react'

/**
 * Registers /sw.js exactly once on mount, in production only.
 * Renders nothing.
 *
 * Why production-only: the dev server's HMR/refresh and the SW's caching
 * strategies fight each other and produce stale chunks. Running the SW in dev
 * leads to confusing "I edited this file but the page didn't update" bugs.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Defer registration until window load to avoid contending with initial paint.
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => {
          // Non-fatal — the site works without an SW. Surface in console for ops.
          console.warn('[sw] registration failed:', err)
        })
    }

    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}