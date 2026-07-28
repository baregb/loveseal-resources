/**
 * Aggregate `content.tags[]` across published content.
 *
 * Two helpers:
 *   1. `getTopTagsForType()` — used by the home page's "Latest X" sections to
 *      render hashtag pill rows per content type. Pass 3.
 *   2. `getAllTagsWithCounts()` — used by `/topics` (the tag index) to render
 *      every tag in the library, sorted by count. Pass 5b.
 *
 * Both read the same column, but with different aggregation scopes and shapes.
 * No schema changes; pure read of an existing column.
 */

import { createClient } from '@/lib/supabase/server'
import { tagSlug } from '@/lib/topic'

type ContentType = 'manual' | 'prophecy' | 'article' | 'blog' | 'sermon'

export interface TypeTag {
  tag:         string
  occurrences: number
}

/**
 * Top N tags across published content of `type`, within the last
 * `windowDays` days. Falls back to a wider window if the recent slice
 * is empty.
 */
export async function getTopTagsForType(
  type:       ContentType,
  windowDays: number = 60,
  limit:      number = 5,
): Promise<TypeTag[]> {
  try {
    const supabase = await createClient()
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

    const fetch = async (gteIso: string | null) => {
      let q = supabase
        .from('content')
        .select('tags, theme')
        .eq('status', 'published')
        .eq('content_type', type)
        .order('created_at', { ascending: false })
        .limit(120)

      if (gteIso) q = q.gte('created_at', gteIso)
      return q
    }

    let { data, error } = await fetch(since.toISOString())

    // Empty in recent window? Drop the time filter and try again.
    if (!error && Array.isArray(data) && data.length === 0) {
      ;({ data, error } = await fetch(null))
    }

    if (error || !data) return []

    const counts = new Map<string, number>()
    for (const row of data as Array<{ tags: string[] | null; theme: string | null }>) {
      const tags = Array.isArray(row.tags) ? row.tags : []
      for (const raw of tags) {
        const t = normalise(raw)
        if (t) counts.set(t, (counts.get(t) ?? 0) + 1)
      }
      const themeTerm = normalise(row.theme ?? '')
      if (themeTerm) counts.set(themeTerm, (counts.get(themeTerm) ?? 0) + 1)
    }

    return [...counts.entries()]
      .map(([tag, occurrences]) => ({ tag, occurrences }))
      .sort((a, b) => (b.occurrences - a.occurrences) || a.tag.localeCompare(b.tag))
      .slice(0, limit)
  } catch {
    return []
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Pass 5b — /topics index helper
   ───────────────────────────────────────────────────────────────────────── */

export interface IndexedTag {
  /** Display label — the original casing of the most-frequent variant. */
  label:       string
  /** URL slug — lowercased, edge-stripped, hyphenated. Stable across casings. */
  slug:        string
  /** Total occurrences across all published content. */
  occurrences: number
  /** Per-type breakdown, for chip-row accents on the index card. */
  byType:      Record<ContentType, number>
}

/**
 * Every tag across every published content row, with totals and a per-type
 * breakdown. Returns a flat array sorted by occurrence count desc, then
 * alphabetically.
 *
 * Reads up to `maxRows` content rows (default 1000) — for a church-scale
 * library that's effectively everything; tune up if the library grows
 * past ~10k items. We do the aggregation in JS rather than via a Postgres
 * RPC because the existing schema doesn't have a tag-aggregation function
 * yet, and writing one would be Pass 5b scope creep.
 */
export async function getAllTagsWithCounts(
  maxRows: number = 1000,
): Promise<IndexedTag[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('content')
      .select('tags, theme, content_type')
      .eq('status', 'published')
      .limit(maxRows)

    if (error || !data) return []

    // Per slug: track total count, per-type count, and a tally of label
    // variants so we can pick the most-frequent casing for display.
    interface Bucket {
      slug:    string
      total:   number
      byType:  Record<ContentType, number>
      labels:  Map<string, number>
    }
    const buckets = new Map<string, Bucket>()

    const record = (raw: string | null, type: ContentType) => {
      if (!raw) return
      const slug = tagSlug(raw)
      if (!slug || slug.length < 3) return
      const labelCandidate = raw.trim()
      let b = buckets.get(slug)
      if (!b) {
        b = {
          slug,
          total:  0,
          byType: { manual: 0, prophecy: 0, article: 0, blog: 0, sermon: 0 },
          labels: new Map(),
        }
        buckets.set(slug, b)
      }
      b.total += 1
      b.byType[type] += 1
      b.labels.set(labelCandidate, (b.labels.get(labelCandidate) ?? 0) + 1)
    }

    for (const row of data as Array<{
      tags:         string[] | null
      theme:        string | null
      content_type: ContentType
    }>) {
      const tags = Array.isArray(row.tags) ? row.tags : []
      for (const raw of tags) record(raw, row.content_type)
      record(row.theme, row.content_type)
    }

    return [...buckets.values()]
      .map(b => {
        // Pick the label variant that appeared most often. Ties: take the
        // alphabetically first to keep results deterministic.
        const sortedLabels = [...b.labels.entries()].sort((a, c) =>
          (c[1] - a[1]) || a[0].localeCompare(c[0])
        )
        return {
          slug:        b.slug,
          label:       sortedLabels[0]?.[0] ?? b.slug,
          occurrences: b.total,
          byType:      b.byType,
        }
      })
      .sort((a, b) => (b.occurrences - a.occurrences) || a.label.localeCompare(b.label))
  } catch {
    return []
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Shared normalisation
   ───────────────────────────────────────────────────────────────────────── */

function normalise(raw: string): string | null {
  if (!raw) return null
  const lowered = raw.toLowerCase().trim()
  const stripped = lowered.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
  if (stripped.length < 3) return null
  return stripped
}