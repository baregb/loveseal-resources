import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import type { Locale } from '@/types'

const supportedLocales: Locale[] = ['en', 'es', 'fr', 'pt', 'ar']
const defaultLocale: Locale = 'en'

export default getRequestConfig(async () => {
  // Read locale from cookie (set by language switcher in Phase 4)
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('locale')?.value as Locale | undefined

  const locale: Locale =
    cookieLocale && supportedLocales.includes(cookieLocale)
      ? cookieLocale
      : defaultLocale

  return {
    locale,
    messages: (await import(`@/i18n/messages/${locale}.json`)).default,
  }
})
