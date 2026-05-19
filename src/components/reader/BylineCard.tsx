'use client'

import { Link } from '@/i18n/navigation'
import InitialsAvatar from './InitialsAvatar'

/**
 * Single-row byline that sits under the Full/Quick toggle.
 *
 *   [ avatar ]  Pastor Ada Mensah  ·  May 13  ·  9 min
 *
 * The dots are middle-dot separators inside spans so that on a narrow
 * viewport the row wraps gracefully — name on row 1, the rest on row 2 —
 * without orphaning a separator at the start of a wrap line.
 *
 * Pass 5c additions:
 *   - `avatarUrl`  — when present, InitialsAvatar shows the image; otherwise
 *                    falls back to initials.
 *   - `authorSlug` — when present, wraps the name in a Link to
 *                    /authors/[slug]. When absent (legacy rows whose
 *                    speaker text didn't match any backfilled author),
 *                    the name renders as plain text.
 */
export default function BylineCard({
  name,
  date,
  readTimeLabel,
  avatarUrl = null,
  authorSlug = null,
}: {
  name:          string | null | undefined
  /** Pre-formatted, locale-aware date string. The byline does no formatting. */
  date:          string
  /** Pre-formatted "9 min" / "12 min" / etc. label from the parent. */
  readTimeLabel: string
  /** Pass 5c — author avatar URL. Falls through to initials when null. */
  avatarUrl?:    string | null
  /** Pass 5c — author slug; when set, name becomes a link to the profile. */
  authorSlug?:   string | null
}) {
  const displayName = (name && name.trim()) || ''

  /* The name component renders as a Link when we have an author slug, plain
     text otherwise. Same visual styling either way — the underline-on-hover
     is the only added cue, picked up from the parent style. */
  const NameEl = displayName && authorSlug ? (
    <Link
      href={{ pathname: '/authors/[slug]', params: { slug: authorSlug } }}
      style={{
        color:          'var(--text-primary)',
        fontWeight:     500,
        textDecoration: 'none',
      }}
      className="byline-author-link"
    >
      {displayName}
    </Link>
  ) : displayName ? (
    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
      {displayName}
    </span>
  ) : null

  return (
    <>
      <div
        style={{
          display:    'flex',
          alignItems: 'center',
          flexWrap:   'wrap',
          gap:        '0.625rem 0.75rem',
          marginBottom: '1.25rem',
          fontFamily: 'var(--font-body)',
        }}
      >
        <InitialsAvatar name={displayName} size={2.25} avatarUrl={avatarUrl} />

        <div
          style={{
            display:    'flex',
            alignItems: 'center',
            flexWrap:   'wrap',
            gap:        '0.375rem 0.625rem',
            fontSize:   '0.875rem',
            color:      'var(--text-secondary)',
            lineHeight: 1.3,
          }}
        >
          {NameEl}
          {displayName && <Dot />}
          <span>{date}</span>
          <Dot />
          <span>{readTimeLabel}</span>
        </div>
      </div>

      {/* Link hover — match the visual pattern used elsewhere; inline
          styles can't target :hover. */}
      <style>{`
        .byline-author-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </>
  )
}

function Dot() {
  return (
    <span
      aria-hidden="true"
      style={{
        color:    'var(--text-faint)',
        fontSize: '0.875rem',
        lineHeight: 1,
      }}
    >
      ·
    </span>
  )
}