import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { translateText, translateArray, chunkHtml, chunkPlainText } from './translate-api'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('chunkHtml', () => {
  it('returns the input unchanged when already under the limit', () => {
    const html = '<p>Hello</p>'
    expect(chunkHtml(html, 100)).toEqual([html])
  })

  it('splits only between top-level siblings, never inside a tag', () => {
    const html = '<p>' + 'a'.repeat(10) + '</p><p>' + 'b'.repeat(10) + '</p><p>' + 'c'.repeat(10) + '</p>'
    const chunks = chunkHtml(html, 20)

    // Every chunk must be well-formed: equal number of <p> opens/closes
    for (const chunk of chunks) {
      const opens  = (chunk.match(/<p>/g) ?? []).length
      const closes = (chunk.match(/<\/p>/g) ?? []).length
      expect(opens).toBe(closes)
    }
    // Reassembling every chunk reproduces the original exactly
    expect(chunks.join('')).toBe(html)
  })

  it('treats void elements (e.g. <br>, <img>) as not changing nesting depth', () => {
    const html = '<p>line one<br><img src="x.png">line two</p>'
    expect(chunkHtml(html, 5)).toEqual([html]) // single top-level element, nothing to split between
  })

  it('keeps a single oversized top-level element as its own chunk rather than corrupting it', () => {
    const big = '<p>' + 'x'.repeat(50) + '</p>'
    const html = big + '<p>short</p>'
    const chunks = chunkHtml(html, 10)

    expect(chunks[0]).toBe(big) // oversized but intact
    expect(chunks.join('')).toBe(html)
  })
})

describe('chunkPlainText', () => {
  it('returns the input unchanged when already under the limit', () => {
    expect(chunkPlainText('short text', 100)).toEqual(['short text'])
  })

  it('splits on paragraph breaks first', () => {
    const text = 'para one '.repeat(3) + '\n\n' + 'para two '.repeat(3)
    const chunks = chunkPlainText(text, 40)
    expect(chunks.join('')).toBe(text)
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('falls back to a hard slice when no natural boundary exists', () => {
    const text = 'x'.repeat(100)
    const chunks = chunkPlainText(text, 30)
    expect(chunks.join('')).toBe(text)
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(30)
  })
})

describe('translateText', () => {
  const ORIGINAL_KEY    = process.env.MS_TRANSLATOR_KEY
  const ORIGINAL_REGION = process.env.MS_TRANSLATOR_REGION

  beforeEach(() => {
    process.env.MS_TRANSLATOR_KEY    = 'test-key'
    process.env.MS_TRANSLATOR_REGION = 'test-region'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    process.env.MS_TRANSLATOR_KEY    = ORIGINAL_KEY
    process.env.MS_TRANSLATOR_REGION = ORIGINAL_REGION
    vi.unstubAllGlobals()
  })

  it('returns "" without calling fetch for empty/whitespace input', async () => {
    expect(await translateText('   ', 'fr')).toBe('')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('makes a single request for text under the size limit', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse([{ translations: [{ text: 'Bonjour', to: 'fr' }] }]),
    )

    const result = await translateText('Hello', 'fr')

    expect(result).toBe('Bonjour')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('splits oversized text into multiple requests and stitches the results back together', async () => {
    const big = '<p>' + 'a'.repeat(30_000) + '</p><p>' + 'b'.repeat(30_000) + '</p>'

    vi.mocked(fetch).mockImplementation(async (_url, init) => {
      const body = JSON.parse((init as RequestInit).body as string) as { text: string }[]
      // Echo back a recognisable "translation" per chunk so we can verify order
      return jsonResponse([{ translations: [{ text: `[T:${body[0].text.length}]`, to: 'fr' }] }])
    })

    const result = await translateText(big, 'fr', { isHtml: true })

    expect(fetch).toHaveBeenCalledTimes(2) // two well-formed <p> chunks
    expect(result).toBe('[T:30007][T:30007]') // '<p>' + 30000 + '</p>' = 30007 chars each
  })

  it('retries on 429 with backoff and does not exceed the configured attempt count', async () => {
    vi.useFakeTimers()
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: 'throttled' }, 429))

    const promise = translateText('Hello', 'fr')
    // Attach the rejection expectation synchronously, before any awaits, so
    // the rejection is never briefly "unhandled" while timers are advanced.
    const expectation = expect(promise).rejects.toThrow('Microsoft Translator error 429')

    // Flush the retry backoff timers (1s, 2s, 4s) without real waiting
    for (let i = 0; i < 3; i++) {
      await vi.advanceTimersByTimeAsync(10_000)
    }

    await expectation
    expect(fetch).toHaveBeenCalledTimes(4) // exactly 4 attempts — no extra untracked 5th call
    vi.useRealTimers()
  })
})

describe('translateArray', () => {
  beforeEach(() => {
    process.env.MS_TRANSLATOR_KEY    = 'test-key'
    process.env.MS_TRANSLATOR_REGION = 'test-region'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns [] for an empty array without calling fetch', async () => {
    expect(await translateArray([], 'fr')).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('preserves empty entries and positions while translating the rest in one call', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse([
        { translations: [{ text: 'Un', to: 'fr' }] },
        { translations: [{ text: 'Deux', to: 'fr' }] },
      ]),
    )

    const result = await translateArray(['One', '', 'Two'], 'fr')

    expect(result).toEqual(['Un', '', 'Deux'])
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('splits into multiple requests when combined size exceeds the per-request limit', async () => {
    const items = [ 'a'.repeat(30_000), 'b'.repeat(30_000) ]
    vi.mocked(fetch).mockImplementation(async (_url, init) => {
      const body = JSON.parse((init as RequestInit).body as string) as { text: string }[]
      return jsonResponse(body.map(() => ({ translations: [{ text: 'x', to: 'fr' }] })))
    })

    const result = await translateArray(items, 'fr')

    expect(fetch).toHaveBeenCalledTimes(2) // one item per batch — combined 60k > 45k limit
    expect(result).toEqual(['x', 'x'])
  })
})
