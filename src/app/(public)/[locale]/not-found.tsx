'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

/**
 * Locale-aware 404.
 *
 * Catches anything inside `(public)/[locale]/*` that doesn't resolve to a
 * concrete page — most commonly a stale link to a deleted article, a typo
 * in a URL, or a path that was never wired up.
 *
 * The thinner root `app/not-found.tsx` exists for truly-unrouted requests
 * (no locale, no recognised prefix) and is intentionally chrome-less.
 * This locale-level one keeps the header + footer because it sits inside
 * `[locale]/layout.tsx` and gives visitors recognisable nav to recover.
 *
 * Pref #2 (rem-based sizes) applied throughout. Existing `not-found.tsx`
 * files (e.g. `content/[id]/not-found.tsx`) still use pixel values from
 * Pass 4c — not retrofitting them here per the standing rule.
 */
export default function LocaleNotFound() {
  const t = useTranslations('notFound.root')

  return (
    <div style={{
      maxWidth:    'var(--width-narrow)',
      margin:      '0 auto',
      padding:     'clamp(3rem, 10vw, 6rem) var(--page-inline-padding)',
      textAlign:   'center',
      minHeight:   '60dvh',
      display:     'flex',
      flexDirection: 'column',
      alignItems:  'center',
      justifyContent: 'center',
      gap:         '1rem',
    }}>
      <div style={{
        fontSize:      '0.6875rem',
        fontWeight:    500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color:         'var(--brand-gold)',
      }}>
        {t('label')}
      </div>

      <h1 style={{
        fontFamily:    'var(--font-display), Barlow Condensed, sans-serif',
        fontSize:      'clamp(2.5rem, 8vw, 4.5rem)',
        fontWeight:    900,
        lineHeight:    0.95,
        textTransform: 'uppercase',
        color:         'var(--text-primary)',
        letterSpacing: '-0.02em',
        margin:        0,
      }}>
        {t('title')}
      </h1>

      <p style={{
        fontSize:   '1rem',
        lineHeight: 1.6,
        color:      'var(--text-secondary)',
        maxWidth:   '40ch',
        margin:     '0.5rem 0 0',
      }}>
        {t('body')}
      </p>

      <div style={{
        marginTop: '1rem',
        display:   'flex',
        gap:       '0.625rem',
        flexWrap:  'wrap',
        justifyContent: 'center',
      }}>
        <Link href="/" style={{
          display:        'inline-block',
          padding:        '0.6875rem 1.375rem',
          background:     'var(--brand-gold)',
          color:          'var(--text-inverse)',
          borderRadius:   '0.5rem',
          fontSize:       '0.875rem',
          fontWeight:     500,
          textDecoration: 'none',
        }}>
          {t('home')}
        </Link>
        <Link href="/content" style={{
          display:        'inline-block',
          padding:        '0.6875rem 1.375rem',
          background:     'transparent',
          color:          'var(--text-primary)',
          border:         '0.0625rem solid var(--border-strong)',
          borderRadius:   '0.5rem',
          fontSize:       '0.875rem',
          fontWeight:     500,
          textDecoration: 'none',
        }}>
          {t('browse')}
        </Link>
      </div>
    </div>
  )
}