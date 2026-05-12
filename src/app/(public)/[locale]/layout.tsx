import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { metadataAlternates } from '@/lib/locale-urls'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'
import PageTransition from '@/components/landing/PageTransition'
import ScrollProgress from '@/components/landing/ScrollProgress'
import { OrganizationSchema, WebsiteSchema } from '@/components/brand/Schema'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/* Per-locale metadata for the home route ('/' on English, '/es', '/fr', …).
   Sets canonical to the current locale's URL and emits hreflang for all 5. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}

  const t = await getTranslations({ locale, namespace: 'hero' })

  return {
    /* Title comes from the hero translations; fallback to the root template. */
    title:      t('headline'),
    alternates: metadataAlternates(locale, ''),
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params:   Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  // Enables static rendering for locale pages
  setRequestLocale(locale)

  /* `dir` is already set on <html> in the root layout based on the resolved
     locale, so no inner wrapper is needed. The wrapper here just provides
     the flex-column shell. */

  return (
    <NextIntlClientProvider locale={locale}>
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-base)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <OrganizationSchema />
        <WebsiteSchema />
        <ScrollProgress />
        <PublicHeader />
        <main style={{ flex: 1, width: '100%' }}>
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        <PublicFooter />
      </div>
    </NextIntlClientProvider>
  )
}