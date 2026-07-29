import type { Locale } from '@/types'

const MS_LOCALE_MAP: Record<Locale, string> = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  pt: 'pt',
  ar: 'ar',
}

interface TranslateOptions {
  sourceLocale?: Locale
  isHtml?: boolean
}

interface MsTranslation {
  text: string
  to:   string
}

interface MsResponseItem {
  detectedLanguage?: { language: string; score: number }
  translations:      MsTranslation[]
}

const ENDPOINT_BASE = 'https://api.cognitive.microsofttranslator.com/translate'

/* Azure hard-caps the Translate operation at 50,000 chars/request (and 1,000
   array elements) — see https://learn.microsoft.com/azure/ai-services/translator/service-limits.
   Over that it either 400s (400050/400077) or, worse, silently drops text.
   We leave headroom below the real cap for encoding overhead and multi-target
   requests. */
const MAX_REQUEST_CHARS  = 45_000
const MAX_ARRAY_ELEMENTS = 900

function getCreds(): { key: string; region: string } {
  const key    = process.env.MS_TRANSLATOR_KEY
  const region = process.env.MS_TRANSLATOR_REGION
  if (!key)    throw new Error('MS_TRANSLATOR_KEY is not set')
  if (!region) throw new Error('MS_TRANSLATOR_REGION is not set')
  return { key, region }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/* Retry a fetch call up to `attempts` times, backing off on 429. Always
   returns the last response it actually made — the old version fell through
   to an extra, un-retried `fetch` after the loop, silently turning "4
   attempts" into 5 and skipping backoff on the last one. */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 4,
): Promise<Response> {
  let delay = 1000
  let res: Response
  for (let i = 0; i < attempts; i++) {
    res = await fetch(url, init)
    if (res.status !== 429) return res
    if (i < attempts - 1) await sleep(delay)
    delay *= 2
  }
  return res!
}

/* Greedily pack an ordered list of strings into chunks no larger than
   `maxChars`. A single oversized element becomes its own (oversized) chunk
   rather than being split — nothing above this call can safely divide it
   further without risking broken markup or a broken sentence. */
function packSegments(segments: string[], maxChars: number): string[] {
  const chunks: string[] = []
  let current = ''
  for (const seg of segments) {
    if (current && current.length + seg.length > maxChars) {
      chunks.push(current)
      current = seg
    } else {
      current += seg
    }
  }
  if (current) chunks.push(current)
  return chunks
}

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

/* Index positions in `html` where tag nesting depth is exactly 0 — i.e. the
   boundaries between top-level sibling elements. Assumes well-formed,
   properly-closed markup (true of our Tiptap editor output); it isn't a full
   HTML5 parser and won't recover from unclosed tags. */
function topLevelBoundaries(html: string): number[] {
  const tagRe = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>/g
  const boundaries: number[] = [0]
  let depth = 0
  let match: RegExpExecArray | null

  while ((match = tagRe.exec(html))) {
    const tag = match[0]
    if (tag.startsWith('<!--')) continue // comments don't nest

    const isClosing      = tag.startsWith('</')
    const isSelfClosing  = /\/>\s*$/.test(tag)
    const name            = tag.match(/^<\/?([a-zA-Z][a-zA-Z0-9-]*)/)?.[1]?.toLowerCase()
    const isVoid           = name ? VOID_ELEMENTS.has(name) : false

    if (isClosing) {
      depth = Math.max(0, depth - 1)
    } else if (!isSelfClosing && !isVoid) {
      depth += 1
    }

    if (depth === 0) boundaries.push(tagRe.lastIndex)
  }

  if (boundaries[boundaries.length - 1] !== html.length) boundaries.push(html.length)
  return boundaries
}

/**
 * Split an HTML fragment into chunks under `maxChars`, breaking only between
 * top-level sibling elements so every chunk stays well-formed on its own —
 * Azure requires "well-formed, complete" elements per request.
 */
export function chunkHtml(html: string, maxChars: number): string[] {
  if (html.length <= maxChars) return [html]

  const boundaries = topLevelBoundaries(html)
  const segments: string[] = []
  for (let i = 1; i < boundaries.length; i++) {
    segments.push(html.slice(boundaries[i - 1], boundaries[i]))
  }
  return packSegments(segments, maxChars)
}

/* Split `text` on `separator`, keeping the separator attached to the
   preceding piece so `segments.join('')` reconstructs the original exactly.
   Returns [text] unchanged if the separator never occurs. */
function splitKeepingSeparator(text: string, separator: string): string[] {
  const parts = text.split(separator)
  if (parts.length === 1) return [text]
  return parts.map((p, i) => (i < parts.length - 1 ? p + separator : p))
}

/**
 * Split plain text into chunks under `maxChars`. Tries paragraph breaks,
 * then line breaks, then sentence boundaries, and only hard-slices
 * mid-sentence as a last resort — each stage only kicks in on pieces the
 * previous stage couldn't get under budget.
 */
export function chunkPlainText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text]

  const hardSplit = (t: string): string[] => {
    const out: string[] = []
    for (let i = 0; i < t.length; i += maxChars) out.push(t.slice(i, i + maxChars))
    return out
  }

  let chunks = packSegments(splitKeepingSeparator(text, '\n\n'), maxChars)
  chunks = chunks.flatMap(c => c.length > maxChars ? packSegments(splitKeepingSeparator(c, '\n'), maxChars) : c)
  chunks = chunks.flatMap(c => c.length > maxChars ? packSegments(splitKeepingSeparator(c, '. '), maxChars) : c)
  chunks = chunks.flatMap(c => c.length > maxChars ? hardSplit(c) : c)
  return chunks
}

/* One actual network call — translates a single string that's already
   known to be within Azure's per-request size limit. */
async function translateChunk(
  text:         string,
  targetLocale: Locale,
  options:      TranslateOptions & { isHtml: boolean },
): Promise<string> {
  const { key, region } = getCreds()

  const params = new URLSearchParams({
    'api-version': '3.0',
    to:            MS_LOCALE_MAP[targetLocale],
    textType:      options.isHtml ? 'html' : 'plain',
  })
  if (options.sourceLocale) {
    params.append('from', MS_LOCALE_MAP[options.sourceLocale])
  }

  const url = `${ENDPOINT_BASE}?${params.toString()}`

  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key':    key,
      'Ocp-Apim-Subscription-Region': region,
      'Content-Type':                 'application/json',
    },
    body: JSON.stringify([{ text }]),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Microsoft Translator error ${res.status}: ${errBody}`)
  }

  const data = (await res.json()) as MsResponseItem[]
  return data[0]?.translations[0]?.text ?? ''
}

/**
 * Translate a single string into the target locale.
 * Returns '' for empty/whitespace input. Throws on API error.
 *
 * Transparently chunks input over Azure's 50,000-char request limit and
 * stitches the results back together, so long article bodies/PDF extracts
 * don't get rejected or silently cut off.
 */
export async function translateText(
  text:         string,
  targetLocale: Locale,
  options:      TranslateOptions = {},
): Promise<string> {
  if (!text || !text.trim()) return ''

  const isHtml = options.isHtml ?? /<[a-z][\s\S]*>/i.test(text)
  const opts   = { ...options, isHtml }

  if (text.length <= MAX_REQUEST_CHARS) {
    return translateChunk(text, targetLocale, opts)
  }

  const chunks = isHtml
    ? chunkHtml(text, MAX_REQUEST_CHARS)
    : chunkPlainText(text, MAX_REQUEST_CHARS)

  const translated: string[] = []
  for (const [i, chunk] of chunks.entries()) {
    // Small pause between chunks of the *same* field so one long field
    // spanning several requests doesn't itself trip per-second quota.
    if (i > 0) await sleep(300)
    translated.push(await translateChunk(chunk, targetLocale, opts))
  }
  return translated.join('')
}

/* Group already-filtered { idx, text } entries into batches that respect
   both the char and array-element limits. */
function batchBySize<T extends { text: string }>(
  items:    T[],
  maxChars: number,
  maxCount: number,
): T[][] {
  const batches: T[][] = []
  let current: T[] = []
  let currentChars = 0

  for (const item of items) {
    if (current.length > 0 && (currentChars + item.text.length > maxChars || current.length >= maxCount)) {
      batches.push(current)
      current = []
      currentChars = 0
    }
    current.push(item)
    currentChars += item.text.length
  }
  if (current.length) batches.push(current)
  return batches
}

async function translateArrayChunk(
  texts:        string[],
  targetLocale: Locale,
  options:      TranslateOptions,
): Promise<string[]> {
  const { key, region } = getCreds()

  const params = new URLSearchParams({
    'api-version': '3.0',
    to:            MS_LOCALE_MAP[targetLocale],
    textType:      'plain',
  })
  if (options.sourceLocale) {
    params.append('from', MS_LOCALE_MAP[options.sourceLocale])
  }

  const url = `${ENDPOINT_BASE}?${params.toString()}`

  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key':    key,
      'Ocp-Apim-Subscription-Region': region,
      'Content-Type':                 'application/json',
    },
    body: JSON.stringify(texts.map(text => ({ text }))),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Microsoft Translator error ${res.status}: ${errBody}`)
  }

  const data = (await res.json()) as MsResponseItem[]
  return data.map(d => d.translations[0]?.text ?? '')
}

/**
 * Translate an array of strings (e.g. summary_points).
 * Batches them into as few API calls as quota allows to save requests, but
 * splits across multiple calls if the combined size would exceed Azure's
 * per-request limits (50,000 chars / 1,000 elements).
 */
export async function translateArray(
  texts:        string[],
  targetLocale: Locale,
  options:      TranslateOptions = {},
): Promise<string[]> {
  if (!texts.length) return []

  // Filter empties but remember positions for reassembly
  const nonEmpty: { idx: number; text: string }[] = []
  texts.forEach((t, idx) => {
    if (t && t.trim()) nonEmpty.push({ idx, text: t })
  })
  if (nonEmpty.length === 0) return texts.map(() => '')

  const batches = batchBySize(nonEmpty, MAX_REQUEST_CHARS, MAX_ARRAY_ELEMENTS)
  const result  = [...texts]

  for (const [i, batch] of batches.entries()) {
    if (i > 0) await sleep(300)
    const translations = await translateArrayChunk(batch.map(b => b.text), targetLocale, options)
    batch.forEach((entry, j) => {
      result[entry.idx] = translations[j] ?? entry.text
    })
  }

  return result
}
