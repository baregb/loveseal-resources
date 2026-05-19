/**
 * Server-side helpers for the public `recent_searches` log.
 *
 * Two responsibilities:
 *
 *   1. `logSearch(query, locale)` — fire-and-forget insert called from
 *      `search-action.ts`. Trims, drops empty / whitespace-only queries,
 *      and never throws — search must keep working even if logging fails.
 *
 *   2. `getTopRecentSearchTerms(...)` — aggregate via the
 *      `top_recent_search_terms` RPC for the home page "In focus" strip.
 *      Falls back to top `content.tags[]` when search log is sparse
 *      (newly launched site) so the strip is never empty.
 *
 * The aggregate read uses the `as never` Supabase 2.49 rpc-args cast
 * pattern documented in the project handoff — same approach as
 * `src/lib/search.ts`. Don't remove the cast without also retesting
 * against pinned `@supabase/supabase-js@2.49`.
 */

import { createClient } from '@/lib/supabase/server'

const MAX_QUERY_LEN = 200
const COLD_START_THRESHOLD = 3
/* Pull tags from content published in the last 30 days for the fallback.
   Long enough to catch a couple of admin batches, short enough to feel
   current. */
const FALLBACK_DAYS = 30

export interface TopTerm {
  term:        string
  occurrences: number
}

type Locale = 'en' | 'es' | 'fr' | 'pt' | 'ar'

/**
 * Insert a row into `recent_searches`. Silent on every failure path —
 * never throws, never blocks the caller, never returns anything useful.
 */
export async function logSearch(query: string, locale: Locale): Promise<void> {
  const trimmed = query.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_QUERY_LEN) return

  try {
    const supabase = await createClient()
    /* `as never` cast mirrors the workaround in `src/lib/search.ts` — the
       postgrest-js v2.49+ typing pipeline sometimes widens the Insert payload
       generic to `never`. The runtime call is unchanged. */
    await supabase
      .from('recent_searches')
      .insert({ query: trimmed, locale } as never)
  } catch {
    /* Intentionally swallowed — logging must not affect the user. */
  }
}

/**
 * Top N distinct terms across recent searches, in descending frequency.
 *
 * Two-tier strategy:
 *   • First, call the `top_recent_search_terms` RPC over the requested
 *     window (default 7 days).
 *   • If the RPC returns fewer than COLD_START_THRESHOLD terms, fall
 *     back to aggregating `content.tags[]` across content published in
 *     the last 30 days. This keeps the strip useful immediately at launch.
 *   • If both feeds come back empty, returns an empty array. Callers
 *     should self-hide their UI in that case.
 */
export async function getTopRecentSearchTerms(
  windowHours: number = 168,
  limit:       number = 5,
): Promise<TopTerm[]> {
  const supabase = await createClient()

  // 1) Primary: recent-search aggregate
  try {
    const { data, error } = await supabase
      .rpc('top_recent_search_terms', {
        window_hours: windowHours,
        n:            limit,
      } as never)

    /* Mirror the cast pattern from `src/lib/search.ts`: postgrest-js widens
       `data` to `never` under the same conditions that force `as never` on
       the Args. The migration's RETURNS clause guarantees the shape. */
    const rows = (data ?? []) as Array<{ term: string; occurrences: number | bigint }>

    if (!error && rows.length >= COLD_START_THRESHOLD) {
      return rows.map(r => ({ term: r.term, occurrences: Number(r.occurrences) }))
    }
  } catch {
    /* fall through to fallback */
  }

  // 2) Fallback: aggregate content.tags[] from recently published content
  return getContentTagsFallback(limit)
}

async function getContentTagsFallback(limit: number): Promise<TopTerm[]> {
  try {
    const supabase = await createClient()
    const since = new Date(Date.now() - FALLBACK_DAYS * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('content')
      .select('tags, theme')
      .eq('status', 'published')
      .gte('created_at', since.toISOString())
      .limit(200)

    if (error || !data) return []

    const counts = new Map<string, number>()
    for (const row of data as Array<{ tags: string[] | null; theme: string | null }>) {
      const tags = Array.isArray(row.tags) ? row.tags : []
      for (const raw of tags) {
        const t = normaliseTerm(raw)
        if (t) counts.set(t, (counts.get(t) ?? 0) + 1)
      }
      const themeTerm = normaliseTerm(row.theme ?? '')
      if (themeTerm) counts.set(themeTerm, (counts.get(themeTerm) ?? 0) + 1)
    }

    return [...counts.entries()]
      .map(([term, occurrences]) => ({ term, occurrences }))
      .sort((a, b) => (b.occurrences - a.occurrences) || a.term.localeCompare(b.term))
      .slice(0, limit)
  } catch {
    return []
  }
}

/** Lowercase, strip non-alphanumeric edge chars, reject if shorter than 3. */
function normaliseTerm(raw: string): string | null {
  if (!raw) return null
  const lowered = raw.toLowerCase().trim()
  /* Strip surrounding non-word characters but keep internal hyphens etc. */
  const stripped = lowered.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
  if (stripped.length < 3) return null
  return stripped
}