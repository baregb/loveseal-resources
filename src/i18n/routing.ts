import { defineRouting } from 'next-intl/routing'

/**
 * Routing config for next-intl.
 *
 * `pathnames` declares the typed routes so `<Link href={{ pathname, params }}>`
 * is type-checked and locale-aware. Only routes used inside typed Link calls
 * need to appear here; ad-hoc string hrefs (`href="/content"`) still work
 * without being declared.
 *
 * Today these route shapes are identical across locales, so each entry maps
 * to itself. If we ever want localised slugs (e.g. `/contenido` on `/es`,
 * `/contenu` on `/fr`), we can switch to per-locale variants here without
 * changing any call sites.
 */
export const routing = defineRouting({
  locales:       ['en', 'es', 'fr', 'pt', 'ar'] as const,
  defaultLocale: 'en',
  localePrefix:  'as-needed', // / for English, /fr/, /es/, etc. for others

  pathnames: {
    '/':              '/',
    '/content':       '/content',
    '/content/[id]':  '/content/[id]',
    '/topic/[slug]':  '/topic/[slug]',
    '/offline':       '/offline',
  },
})

export type AppLocale = (typeof routing.locales)[number]

export const LOCALES_META: Record<AppLocale, { label: string; native: string; flag: string; dir: 'ltr' | 'rtl' }> = {
  en: { label: 'English',     native: 'English',     flag: '🇬🇧', dir: 'ltr' },
  es: { label: 'Spanish',     native: 'Español',     flag: '🇪🇸', dir: 'ltr' },
  fr: { label: 'French',      native: 'Français',    flag: '🇫🇷', dir: 'ltr' },
  pt: { label: 'Portuguese',  native: 'Português',   flag: '🇧🇷', dir: 'ltr' },
  ar: { label: 'Arabic',      native: 'العربية',     flag: '🇸🇦', dir: 'rtl' },
}