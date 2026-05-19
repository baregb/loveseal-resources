'use server'

import { searchContent, type SearchResult } from '@/lib/search'
import { logSearch } from '@/lib/recent-searches'

type SupportedLocale = 'en' | 'es' | 'fr' | 'pt' | 'ar'

const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'es', 'fr', 'pt', 'ar']

function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/**
 * Server action invoked by PublicContentList on a debounced keystroke.
 *
 * Why an action and not a route handler: same security boundary, no
 * separate route file, and the client gets a typed function import.
 *
 * Pass 3 adds fire-and-forget logging to `recent_searches` so the home
 * page "In focus this week" strip can surface trending terms. The log
 * call cannot block or affect the user-facing result — `logSearch`
 * never throws, and we don't await it before returning.
 */
export async function searchContentAction(
  query:  string,
  locale: string,
): Promise<SearchResult> {
  /* Fire-and-forget. The deliberate lack of `await` here is the point:
     even if the database is slow or the row violates RLS, the search
     response is unaffected. */
  if (isSupportedLocale(locale)) {
    void logSearch(query, locale)
  }

  return searchContent(query, locale)
}