'use client'

import { Link } from '@/i18n/navigation'

/**
 * Reader breadcrumb — Home / Topics / [Type] / [Title…]
 *
 * Per Pass 4 Q10: the "Topics" segment is a label-only rename — for now it
 * still routes to `/content`. Pass 5 will introduce the real `/topic` index
 * page and we'll repoint this link without renaming.
 *
 * The last crumb (title) truncates with `...` if longer than ~22 characters
 * on mobile / ~36 on wider screens. Implementation uses CSS line clamp
 * with text-overflow ellipsis on a max-width container — simpler than JS
 * truncation and respects the locale's character width.
 */
export default function Breadcrumb({
  homeLabel,
  topicsLabel,
  typeLabel,
  title,
  contentType,
}: {
  homeLabel:   string
  topicsLabel: string
  typeLabel:   string
  title:       string
  contentType: 'manual' | 'prophecy' | 'article' | 'blog'
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display:    'flex',
        alignItems: 'center',
        flexWrap:   'wrap',
        gap:        '0.375rem',
        marginBottom: '1.25rem',
        fontFamily: 'var(--font-body)',
        fontSize:   '0.8125rem',
        color:      'var(--text-tertiary)',
      }}
    >
      <Link href="/" style={crumbLinkStyle}>{homeLabel}</Link>
      <Sep />

      {/* Topics → currently routes to /content (the library index).
          Pass 5 will introduce a true /topic index and repoint this. */}
      <Link href="/content" style={crumbLinkStyle}>{topicsLabel}</Link>
      <Sep />

      <Link
        href={{ pathname: '/content', query: { type: contentType } }}
        style={crumbLinkStyle}
      >
        {typeLabel}
      </Link>
      <Sep />

      <span
        style={{
          color:         'var(--text-primary)',
          fontWeight:    500,
          maxWidth:      'min(60vw, 18rem)',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          whiteSpace:    'nowrap',
        }}
        title={title}
      >
        {title}
      </span>
    </nav>
  )
}

function Sep() {
  return (
    <span
      aria-hidden="true"
      style={{ color: 'var(--text-faint)', fontSize: '0.8125rem' }}
    >
      /
    </span>
  )
}

const crumbLinkStyle: React.CSSProperties = {
  color:          'var(--text-tertiary)',
  textDecoration: 'none',
  transition:     'color 0.12s',
}