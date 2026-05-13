import type { MetadataRoute } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'

/**
 * Web App Manifest.
 *
 * Served at /manifest.webmanifest. Next.js picks up `manifest.ts` at the
 * app root and exposes it via the metadata-file convention.
 *
 * Locale: the manifest itself is served once per page-load, so we use whatever
 * locale the request resolves to (via getLocale). On a real install (Add to
 * Home Screen) the browser only fetches the manifest once and caches the name
 * for the lifetime of the installed app — so the locale at install time wins.
 * That's the standard PWA tradeoff; we don't try to outsmart it.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const locale = await getLocale()
  const t      = await getTranslations({ locale, namespace: 'manifest' })

  return {
    name:             t('name'),
    short_name:       t('shortName'),
    description:      t('description'),
    start_url:        '/',
    display:          'standalone',
    orientation:      'portrait',
    background_color: '#212529',
    theme_color:      '#212529',
    lang:             locale,
    dir:              locale === 'ar' ? 'rtl' : 'ltr',
    categories:       ['books', 'education', 'lifestyle'],
    icons: [
      {
        src:     '/icons/icon-192.png',
        sizes:   '192x192',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/icons/icon-512.png',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/icons/icon-512-maskable.png',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'maskable',
      },
    ],
  }
}