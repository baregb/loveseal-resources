import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, DM_Sans } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { themeScript } from '@/lib/theme-script'
import '@/styles/globals.css'

const barlowCondensed = Barlow_Condensed({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
  preload: false,
})

const dmSans = DM_Sans({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title:       { default: 'Lively Resources', template: '%s | Lively Resources' },
  description: 'Manuals, Prophecies, Articles, and Blog from LoveSeal Church — Lively Resources for the Body of Christ.',
}

export const viewport: Viewport = {
  themeColor:    [
    { media: '(prefers-color-scheme: light)', color: '#F8F9FA' },
    { media: '(prefers-color-scheme: dark)',  color: '#0f1012' },
  ],
  width:         'device-width',
  initialScale:  1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale   = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`${barlowCondensed.variable} ${dmSans.variable}`}
      style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
      suppressHydrationWarning
    >
      <head>
        {/* Apply theme before hydration to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
