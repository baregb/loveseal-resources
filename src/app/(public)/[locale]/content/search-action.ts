'use server'

import { searchContent, type SearchResult } from '@/lib/search'

/**
 * Server action invoked by PublicContentList on a debounced keystroke.
 *
 * Why an action and not a route handler: same security boundary, no
 * separate route file, and the client gets a typed function import.
 */
export async function searchContentAction(
  query:  string,
  locale: string,
): Promise<SearchResult> {
  return searchContent(query, locale)
}