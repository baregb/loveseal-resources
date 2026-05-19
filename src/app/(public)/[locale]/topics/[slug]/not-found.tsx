'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

/**
 * Caught by `notFound()` inside `/topics/[slug]/page.tsx` when the slug
 * doesn't resolve to any tag in the library. Sends visitors back to the
 * `/topics` index, which is more useful here than `/content` (they were
 * already browsing by tag).
 */
export default function TopicTagNotFound() {
  const t = useTranslations('notFound.tag')

  return (
    <div style={{
      maxWidth:  'var(--width-narrow)',
      margin:    '0 auto',
      padding:   '5rem var(--page-inline-padding)',
      textAlign: 'center',
    }}>
      <p style={{
        fontSize:      '0.6875rem',
        fontWeight:    500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color:         'var(--brand-gold)',
        marginBottom:  '0.75rem',
      }}>
        {t('label')}
      </p>
      <h1 style={{
        fontFamily:    'var(--font-display), Barlow Condensed, sans-serif',
        fontSize:      'clamp(2.25rem, 6vw, 3.5rem)',
        fontWeight:    900,
        textTransform: 'uppercase',
        color:         'var(--text-primary)',
        lineHeight:    1.0,
        marginBottom:  '1rem',
      }}>
        {t('title')}
      </h1>
      <p style={{
        fontSize:    '0.875rem',
        color:       'var(--text-tertiary)',
        marginBottom: '2rem',
        lineHeight:  1.6,
      }}>
        {t('body')}
      </p>
      <Link href="/topics" style={{
        display:        'inline-block',
        padding:        '0.6875rem 1.375rem',
        background:     'var(--brand-gold)',
        color:          'var(--text-inverse)',
        borderRadius:   '0.5rem',
        fontSize:       '0.875rem',
        fontWeight:     500,
        textDecoration: 'none',
      }}>
        {t('browse')}
      </Link>
    </div>
  )
}