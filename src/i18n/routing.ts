import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales:       ['en', 'es', 'fr', 'pt', 'ar'] as const,
  defaultLocale: 'en',
  localePrefix:  'as-needed', // / for English, /fr/, /es/, etc. for others
})

export type AppLocale = (typeof routing.locales)[number]

export const LOCALES_META: Record<AppLocale, { label: string; native: string; flag: string; dir: 'ltr' | 'rtl' }> = {
  en: { label: 'English',     native: 'English',     flag: '🇬🇧', dir: 'ltr' },
  es: { label: 'Spanish',     native: 'Español',     flag: '🇪🇸', dir: 'ltr' },
  fr: { label: 'French',      native: 'Français',    flag: '🇫🇷', dir: 'ltr' },
  pt: { label: 'Portuguese',  native: 'Português',   flag: '🇧🇷', dir: 'ltr' },
  ar: { label: 'Arabic',      native: 'العربية',     flag: '🇸🇦', dir: 'rtl' },
}
