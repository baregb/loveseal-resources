import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, DM_Sans } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import '@/styles/globals.css'

/* ─────────────────────────────────────────────────────────────────────────────
   FONTS — configured here once, exposed as CSS variables.
   To change fonts: update only these two declarations.
   All components reference var(--font-display) and var(--font-body).
   ───────────────────────────────────────────────────────────────────────────── */

const barlowCondensed = Barlow_Condensed({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
})

const dmSans = DM_Sans({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

/* ─────────────────────────────────────────────────────────────────────────────
   METADATA — base metadata, overridden per page
   ───────────────────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Love Seal Church',
    template: '%s | Love Seal Church',
  },
  description:
    'Access Manuals, Prophecies, Articles, and Blog posts from Love Seal Church. Read, download, and share the word.',
  keywords: ['church', 'prophecy', 'manuals', 'articles', 'blog', 'word of God'],
  authors: [{ name: 'Love Seal Church' }],
  creator: 'Love Seal Church',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Love Seal Church',
    title: 'Love Seal Church',
    description: 'Access Manuals, Prophecies, Articles, and Blog posts from Love Seal Church.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Love Seal Church',
    description: 'Access Manuals, Prophecies, Articles, and Blog posts from Love Seal Church.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export const viewport: Viewport = {
  themeColor: '#212529',
  width: 'device-width',
  initialScale: 1,
}

/* ─────────────────────────────────────────────────────────────────────────────
   ROOT LAYOUT
   ───────────────────────────────────────────────────────────────────────────── */

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`${barlowCondensed.variable} ${dmSans.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
