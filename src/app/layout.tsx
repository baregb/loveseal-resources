import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, DM_Sans } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { themeScript } from '@/lib/theme-script'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'
import '@/styles/globals.css'

/* Barlow Condensed is the display font: hero headline, all H1s, all H2s, all
   ContentCard titles, all section eyebrows. It IS the LCP-eligible text on
   most pages, so preloading it is a real LCP win. The body font (DM Sans) is
   used for everything else and isn't on the LCP path — leave it unpreloaded. */
const barlowCondensed = Barlow_Condensed({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
  preload: true,
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
  title:        { default: 'Lively Resources', template: '%s | Lively Resources' },
  description:  'Manuals, Prophecies, Articles, and Blog from LoveSeal Church — Lively Resources for the Body of Christ.',
  manifest:     '/manifest.webmanifest',
  applicationName: 'Lively Resources',
  appleWebApp: {
    capable:       true,
    statusBarStyle: 'black-translucent',
    title:         'Lively Resources',
  },
  icons: {
    /* Standard tab favicon — multi-resolution .ico for broad legacy support. */
    icon:     [{ url: '/icons/favicon.ico', sizes: 'any' }],
    /* iOS home-screen icon. iOS ignores the manifest's `icons` array, so this
       <link rel="apple-touch-icon"> is the only way to control its install image. */
    apple:    [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  formatDetection: {
    /* Stop iOS Safari auto-linking phone numbers in article text. */
    telephone: false,
  },
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
        {/* Registers /sw.js in production only. Renders nothing. */}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}