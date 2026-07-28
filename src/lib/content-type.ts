/**
 * The one place that knows what a content type looks like.
 *
 * Before this module the same five colours were redeclared in a dozen
 * components, and two of them (ContentCard, LatestSection) had manual and
 * prophecy transposed — so a manual showed blue in the header and the reader
 * but red on its own card. Everything now reads from here.
 *
 * Values resolve to the CSS custom properties defined in styles/globals.css,
 * which keeps the hexes in exactly one file. Inline `style={{}}` objects
 * resolve `var()` fine, so callers can use these anywhere a colour goes.
 *
 * Three roles per type — see the globals.css block for what each one means:
 *   accent  dots, pills, eyebrows, borders
 *   tint    card / placeholder background wash
 *   ink     accent darkened to read as text on its own tint
 */

import type { ContentType } from '@/types'

export const CONTENT_TYPE_ACCENT: Record<ContentType, string> = {
  manual:   'var(--color-manual)',
  prophecy: 'var(--color-prophecy)',
  article:  'var(--color-article)',
  blog:     'var(--color-blog)',
  sermon:   'var(--color-sermon)',
}

export const CONTENT_TYPE_TINT: Record<ContentType, string> = {
  manual:   'var(--color-manual-tint)',
  prophecy: 'var(--color-prophecy-tint)',
  article:  'var(--color-article-tint)',
  blog:     'var(--color-blog-tint)',
  sermon:   'var(--color-sermon-tint)',
}

export const CONTENT_TYPE_INK: Record<ContentType, string> = {
  manual:   'var(--color-manual-ink)',
  prophecy: 'var(--color-prophecy-ink)',
  article:  'var(--color-article-ink)',
  blog:     'var(--color-blog-ink)',
  sermon:   'var(--color-sermon-ink)',
}

/**
 * English display names. Public pages translate via the `content.types`
 * message namespace instead; these serve the admin dashboard (which is
 * English-only) and act as the fallback when no translator is in scope.
 *
 * Note `sermon` → "Sermon Notes": the enum value is singular to match its
 * siblings and to keep `/topic/sermon` clean, but it is never the label.
 */
export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  manual:   'Manual',
  prophecy: 'Prophecy',
  article:  'Article',
  blog:     'Blog',
  sermon:   'Sermon Notes',
}

/* ── Lookups ──────────────────────────────────────────────────────────────
   These take a plain `string` rather than `ContentType` because most callers
   hold a value straight off a Supabase row, which is typed loosely at the
   query boundary. Each falls back rather than returning undefined, so an
   unrecognised value degrades to neutral styling instead of a blank colour. */

export function contentTypeAccent(type: string): string {
  return CONTENT_TYPE_ACCENT[type as ContentType] ?? 'var(--text-secondary)'
}

export function contentTypeTint(type: string): string {
  return CONTENT_TYPE_TINT[type as ContentType] ?? 'var(--bg-elevated)'
}

export function contentTypeInk(type: string): string {
  return CONTENT_TYPE_INK[type as ContentType] ?? 'var(--text-primary)'
}

export function contentTypeLabel(type: string): string {
  return CONTENT_TYPE_LABEL[type as ContentType] ?? type
}
