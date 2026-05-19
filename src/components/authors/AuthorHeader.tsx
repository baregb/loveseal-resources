'use client'

import InitialsAvatar from '@/components/reader/InitialsAvatar'

/**
 * Author profile hero — large avatar + name + bio + content count.
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ AVATAR    AUTHOR                                         │
 *   │ (big)     Pastor Ada Mensah                              │
 *   │           One-paragraph bio, optional. Reads at ~52ch.   │
 *   │           23 items                                       │
 *   └──────────────────────────────────────────────────────────┘
 *
 * Reuses InitialsAvatar with a larger size prop so the same image-or-
 * initials logic powers both the byline avatar and the profile avatar.
 */

interface AuthorHeaderProps {
  name:        string
  bio:         string | null
  avatarUrl:   string | null
  /** Pre-formatted plural count, e.g. "23 items" or "no items yet". */
  countLabel:  string
  /** Eyebrow line ("AUTHOR"). Translation supplied by caller. */
  eyebrow:     string
}

export default function AuthorHeader({
  name,
  bio,
  avatarUrl,
  countLabel,
  eyebrow,
}: AuthorHeaderProps) {
  return (
    <header
      style={{
        display:       'flex',
        flexWrap:      'wrap',
        gap:           '1.5rem',
        alignItems:    'flex-start',
        marginBottom:  '2.5rem',
      }}
    >
      <InitialsAvatar name={name} avatarUrl={avatarUrl} size={6} />

      <div style={{ flex: '1 1 17rem', minWidth: 0 }}>
        <p style={{
          fontSize:      '0.6875rem',
          fontWeight:    500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color:         'var(--brand-gold)',
          margin:        '0 0 0.5rem',
          fontFamily:    'var(--font-body)',
        }}>
          {eyebrow}
        </p>

        <h1 style={{
          fontFamily:    'var(--font-display), Barlow Condensed, sans-serif',
          fontSize:      'clamp(2rem, 5vw, 3.25rem)',
          fontWeight:    900,
          textTransform: 'uppercase',
          color:         'var(--text-primary)',
          lineHeight:    0.98,
          letterSpacing: '-0.02em',
          margin:        '0 0 0.5rem',
        }}>
          {name}
        </h1>

        {bio && (
          <p style={{
            fontSize:   '1rem',
            lineHeight: 1.6,
            color:      'var(--text-secondary)',
            maxWidth:   '52ch',
            margin:     '0.75rem 0 0.875rem',
          }}>
            {bio}
          </p>
        )}

        <p style={{
          fontSize: '0.875rem',
          color:    'var(--text-tertiary)',
          margin:   0,
        }}>
          {countLabel}
        </p>
      </div>
    </header>
  )
}