/**
 * Estimate read-time for a body of text or HTML.
 *
 * Strips HTML tags, normalises whitespace, and divides by an average adult
 * reading speed of 220 words/minute (a common research-backed default for
 * silent prose reading; not slow enough to feel patronising, not fast enough
 * to under-promise).
 *
 * Always returns at least 1 minute — a zero-minute read isn't a useful label.
 *
 * Pass 5a status:
 *   Prefer the new `content.read_time_minutes` column when present. It's
 *   computed server-side by the `compute_read_time_minutes` SQL function +
 *   `content_read_time` trigger (same 220 wpm constant, same GREATEST(1, …)
 *   floor) on every insert/update of `extracted_text` or `body_html`, and
 *   was backfilled by `20260518_pass5a_read_time.sql`.
 *
 *   This helper stays as the runtime fallback for:
 *     - legacy rows where the column is still NULL (none, after backfill —
 *       but defensive code always reads `item.read_time_minutes ?? readTimeMinutes(...)`)
 *     - the Quick view, which estimates against summary text rather than
 *       the full body and so wants a fresh, in-memory computation
 *
 *   Keep both paths in sync: change the constant or the regex here and you
 *   must also change `compute_read_time_minutes()` in the SQL migration.
 */
const WORDS_PER_MINUTE = 220

export function countWords(text: string | null | undefined): number {
  if (!text) return 0
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length
}

export function readTimeMinutes(text: string | null | undefined): number {
  const words = countWords(text)
  if (words === 0) return 1
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}