import { createClient } from '@/lib/supabase/server'

export interface SearchHit {
  id:   string
  rank: number
}

export interface SearchResult {
  /**
   * Whether the query was actually run (false for empty/whitespace input).
   * Caller should treat a non-ran search as "show everything" rather than
   * "no results".
   */
  ran:  boolean
  hits: SearchHit[]
}

const EMPTY_RESULT: SearchResult = { ran: false, hits: [] }

/**
 * Full-text search across published content + the locale-matching translation
 * row, returning a ranked list of content IDs.
 *
 * The Postgres-side `search_content` RPC uses `websearch_to_tsquery` which
 * accepts free user input — quotes are phrase searches, `-foo` excludes, `or`
 * is supported, no escaping needed.
 *
 * Returns `EMPTY_RESULT` (ran=false) for any of:
 *   - empty / whitespace-only query
 *   - query <2 chars (single-char tsquery is rarely useful and returns noise)
 *   - RPC error (logged; we don't blow up the page)
 *
 * `ran=true` with `hits=[]` means "we searched and matched nothing" — the
 * caller should render the empty state.
 */
export async function searchContent(
  rawQuery: string,
  locale:   string,
): Promise<SearchResult> {
  const q = (rawQuery ?? '').trim()
  if (q.length < 2) return EMPTY_RESULT

  const supabase = await createClient()

  /* The Args cast here is a workaround for a postgrest-js typing quirk that
     surfaces in v2.50+: the rpc<...>() overload sometimes infers Args as
     `undefined` even when the Database type declares the function. Casting
     to `never` lets the call type-check across versions while preserving the
     return-type inference for `data`. */
  const { data, error } = await supabase.rpc(
    'search_content',
    { q, search_locale: locale } as never,
  )

  if (error) {
    console.error('[search] rpc error:', error)
    return EMPTY_RESULT
  }

  return {
    ran:  true,
    hits: (data ?? []) as SearchHit[],
  }
}