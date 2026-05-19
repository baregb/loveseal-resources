/**
 * External links to the parent LoveSeal Church web presence.
 *
 * These point off-site (not to internal Lively Resources routes). URLs come
 * from `NEXT_PUBLIC_LOVESEAL_*` env vars and fall back to `#` if unset, so
 * ministry team can update them in Vercel without code changes.
 *
 * Used in the public footer ABOUT column. Always rendered with
 * `rel="noopener noreferrer"` and `target="_blank"` since they're external.
 */

const env = (key: string): string => {
  const v = process.env[key]
  return v && v.trim().length > 0 ? v.trim() : '#'
}

export const EXTERNAL_LINKS = {
  /** Marketing home of LoveSeal Church (the parent organisation) */
  loveseal: env('NEXT_PUBLIC_LOVESEAL_HOME'),
  /** "Our story" / about page on the parent site */
  story:    env('NEXT_PUBLIC_LOVESEAL_STORY'),
  /** Contact page on the parent site */
  contact:  env('NEXT_PUBLIC_LOVESEAL_CONTACT'),
  /** Giving / donation page on the parent site */
  give:     env('NEXT_PUBLIC_LOVESEAL_GIVE'),
} as const

export type ExternalLinkKey = keyof typeof EXTERNAL_LINKS