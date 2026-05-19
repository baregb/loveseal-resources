/**
 * Root not-found.
 *
 * Catches requests Next.js can't even route to a locale (e.g. a path that
 * doesn't begin with a recognised locale prefix, or a request that arrives
 * before middleware has resolved a locale). Sits *outside* `[locale]`, so
 * `next-intl` hooks aren't usable here — keep this English-only.
 *
 * The locale-aware sibling at `(public)/[locale]/not-found.tsx` handles
 * the common case: a known locale, an unknown path inside it. That one
 * gets translations, header + footer, and a fuller layout.
 *
 * This page deliberately renders a minimal layout (no font import, no
 * theme provider) so it's reliable even when something deeper in the
 * tree is misbehaving. The visual reads as "missing page" without
 * pretending to be the full site.
 */

import Link from 'next/link'

export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin:         0,
          minHeight:      '100dvh',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '1.5rem',
          textAlign:      'center',
          background:     '#F8F9FA',
          color:          '#212529',
          fontFamily:     '"DM Sans", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize:      '0.6875rem',
            fontWeight:    500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color:         '#F5AE41',
            marginBottom:  '0.75rem',
          }}
        >
          404
        </div>

        <h1
          style={{
            fontFamily:    '"Barlow Condensed", system-ui, sans-serif',
            fontSize:      'clamp(2.5rem, 8vw, 4.5rem)',
            fontWeight:    900,
            lineHeight:    0.95,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            margin:        '0 0 1rem',
          }}
        >
          Page not found
        </h1>

        <p
          style={{
            fontSize:   '1rem',
            lineHeight: 1.6,
            color:      '#6c757d',
            maxWidth:   '40ch',
            margin:     '0 0 1.5rem',
          }}
        >
          The page you’re looking for doesn’t exist or has been moved.
        </p>

        <Link
          href="/"
          style={{
            display:        'inline-block',
            padding:        '0.6875rem 1.375rem',
            background:     '#F5AE41',
            color:          '#212529',
            borderRadius:   '0.5rem',
            fontSize:       '0.875rem',
            fontWeight:     500,
            textDecoration: 'none',
          }}
        >
          Go home
        </Link>
      </body>
    </html>
  )
}