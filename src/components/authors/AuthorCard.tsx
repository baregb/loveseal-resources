'use client'

import { Link } from '@/i18n/navigation'
import InitialsAvatar from '@/components/reader/InitialsAvatar'

/**
 * Author tile for the /authors index page.
 *
 * Mirrors the visual rhythm of the topic-index tiles (large avatar + name +
 * count chip) but goes denser and rectangular because /authors is a longer
 * list than /topics typically is.
 *
 *   ┌──────────────────────────────────┐
 *   │ [avatar]  Pastor Ada Mensah      │
 *   │           23 items               │
 *   └──────────────────────────────────┘
 */

interface AuthorCardProps {
  slug:         string
  name:         string
  avatarUrl:    string | null
  /** Pre-formatted plural count, e.g. "23 items". */
  countLabel:   string
}

export default function AuthorCard({
  slug, name, avatarUrl, countLabel,
}: AuthorCardProps) {
  return (
    <Link
      href={{ pathname: '/authors/[slug]', params: { slug } }}
      className="author-card-tile"
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '0.875rem',
        padding:        '0.875rem 1rem',
        background:     'var(--bg-raised)',
        border:         '0.0625rem solid var(--border-subtle)',
        borderRadius:   '0.625rem',
        textDecoration: 'none',
        color:          'var(--text-primary)',
        transition:     'border-color 0.12s, transform 0.12s',
        minWidth:       0,
      }}
    >
      <InitialsAvatar name={name} avatarUrl={avatarUrl} size={2.75} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1875rem', minWidth: 0 }}>
        <span style={{
          fontFamily:    'var(--font-body)',
          fontSize:      '0.9375rem',
          fontWeight:    500,
          color:         'var(--text-primary)',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          whiteSpace:    'nowrap',
        }}>
          {name}
        </span>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize:   '0.75rem',
          color:      'var(--text-tertiary)',
        }}>
          {countLabel}
        </span>
      </div>
    </Link>
  )
}