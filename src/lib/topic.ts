/**
 * Helpers for `/topic/[type]` and `/topics/[slug]` landing pages.
 *
 * Two flavours of topic page:
 *   - `/topic/[type]`   — filter the library by `content_type`. The slug IS
 *                         the enum value (singular: manual / prophecy /
 *                         article / blog / sermon). Pass 5b.
 *   - `/topics/[slug]`  — filter by a tag from `content.tags[]`. Pass 5b.
 *
 * `/topics` (plural) is the index of all tags with counts.
 *
 * Pass 5c will add `/authors` + `/authors/[slug]` alongside these.
 */

import { contentTypeAccent } from '@/lib/content-type'

export type ContentType = 'manual' | 'prophecy' | 'article' | 'blog' | 'sermon'

export const CONTENT_TYPES: readonly ContentType[] = ['manual', 'prophecy', 'article', 'blog', 'sermon'] as const

/**
 * Type guard so `/topic/[type]/page.tsx` can validate the route param before
 * calling `notFound()`. Anything outside the enum is a 404.
 */
export function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value)
}

/**
 * Maps a content_type enum value to the `nav` translation key used to render
 * its display name. Caller does the `useTranslations('nav')(navKey)` lookup —
 * keeps this file translation-agnostic.
 *
 * The nav namespace uses *plural* labels ("Manuals", "Prophecies") because
 * that's how the header reads. Slugs are singular (`manual`) but display
 * is plural ("Manuals") — these are different concerns.
 */
export function typeNavKey(type: ContentType): 'manuals' | 'prophecies' | 'articles' | 'blog' | 'sermons' {
  switch (type) {
    case 'manual':   return 'manuals'
    case 'prophecy': return 'prophecies'
    case 'article':  return 'articles'
    case 'blog':     return 'blog'
    case 'sermon':   return 'sermons'
  }
}

/**
 * Brand colour for the type chip and eyebrow accent on the topic page hero.
 * Thin re-export of the shared palette — kept so existing `@/lib/topic`
 * imports keep working, but lib/content-type.ts owns the values.
 */
export function typeAccentColor(type: ContentType): string {
  return contentTypeAccent(type)
}

/**
 * Normalise a tag slug for matching against the `tags[]` column.
 *
 * `content.tags` stores raw user-entered strings — "Faith", "faith",
 * "FAITH" can all coexist. We lowercase + trim + strip non-alphanumeric
 * edges to make `/topics/faith` match all three. Matching is done with
 * Postgres `lower(...) = lower(...)` inside the query, not here — this
 * helper exists for the inverse direction: turning user-typed tags
 * into stable URL slugs.
 *
 * Mirrors the normalise() inside lib/content-tags.ts so the
 * /topics index slugs and /topics/[slug] page resolution agree on
 * what counts as the same tag.
 */
export function tagSlug(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw
    .toLowerCase()
    .trim()
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
    .replace(/\s+/g, '-')
}