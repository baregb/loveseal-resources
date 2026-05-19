'use client'

/**
 * Avatar — circular image when an `avatarUrl` is provided, initials
 * fallback otherwise.
 *
 * Pass 4 initials-only avatar: a colored circle with 1–2 white letters,
 * background colour picked deterministically from a 6-colour palette
 * using a tiny hash of the source name.
 *
 * Pass 5c adds an `avatarUrl` prop. When set, renders next/image inside
 * the same circular frame. Falls through to the initials path when the
 * URL is empty/null so the same component still handles legacy rows
 * that don't have a backfilled author profile.
 *
 * Two-letter initials are drawn from the first letters of the first two
 * whitespace-separated tokens ("Pastor Ada Mensah" → "AM" — honorifics
 * are skipped). For single-token names we use the first two letters.
 * For an empty/null name we fall back to a neutral grey circle with a
 * question-mark glyph.
 */

import Image from 'next/image'

const PALETTE: ReadonlyArray<string> = [
  '#E07A3C', // amber (matches design Image 2)
  '#4498CC', // steel blue
  '#C32126', // firebrick
  '#5BAA6E', // sage
  '#7A5BC9', // violet
  '#D4A03A', // sandy gold
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function deriveInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  const tokens = trimmed.split(/\s+/).filter(Boolean)

  // Skip honorifics like "Pastor", "Dr.", "Rev." when picking initials —
  // "Pastor Ada Mensah" → "AM", not "PA". Falls back to whatever's there
  // if every token is an honorific.
  const HONORIFICS = new Set(['pastor', 'dr', 'dr.', 'rev', 'rev.', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'sir', 'lady'])
  const meaningful = tokens.filter(tok => !HONORIFICS.has(tok.toLowerCase()))
  const source = meaningful.length > 0 ? meaningful : tokens

  if (source.length >= 2) {
    return (source[0][0] + source[1][0]).toUpperCase()
  }
  // Single token — use its first two letters
  return source[0].slice(0, 2).toUpperCase()
}

export default function InitialsAvatar({
  name,
  size = 2.25,
  avatarUrl = null,
}: {
  /** Source name. Empty/null renders the fallback "?" glyph. */
  name: string | null | undefined
  /**
   * Diameter in `rem`. Defaults to 2.25rem (~36px at 16px root) to match the
   * design's small byline circle.
   */
  size?: number
  /**
   * Pass 5c — when set, renders the image inside the circle instead of
   * initials. Falsy → falls back to initials. Should be a fully-qualified
   * URL (the `author-avatars` bucket is public so the public URL works
   * directly from any component without a signing step).
   */
  avatarUrl?: string | null
}) {
  const safeName = (name ?? '').trim()
  const dim = `${size}rem`

  /* When we have an avatar URL, render the image inside the circle. We
     still pass `aria-label` instead of `alt` because the visible name is
     already rendered alongside in BylineCard — the avatar itself is
     decorative-with-context, not the primary identifier. */
  if (avatarUrl) {
    /* Convert rem to a px approximation for next/image's required
       width/height numeric props. 1rem = 16px assumption. The image is
       served at 2× resolution via the `sizes` prop so high-DPI screens
       still render crisply at the target visual size. */
    const px = Math.round(size * 16)

    return (
      <span
        aria-hidden="true"
        style={{
          display:        'inline-flex',
          alignItems:     'center',
          justifyContent: 'center',
          width:          dim,
          height:         dim,
          borderRadius:   '50%',
          overflow:       'hidden',
          flexShrink:     0,
          background:     'var(--bg-elevated)',
        }}
      >
        <Image
          src={avatarUrl}
          alt=""
          width={px}
          height={px}
          sizes={`${px}px`}
          style={{
            width:      '100%',
            height:     '100%',
            objectFit:  'cover',
            display:    'block',
          }}
        />
      </span>
    )
  }

  /* Initials fallback path — Pass 4 behaviour, unchanged. */
  const initials = deriveInitials(safeName)
  const bg = safeName
    ? PALETTE[hash(safeName) % PALETTE.length]
    : 'var(--bg-elevated)'

  return (
    <span
      aria-hidden="true"
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          dim,
        height:         dim,
        borderRadius:   '50%',
        background:     bg,
        color:          '#FFFFFF',
        fontFamily:     'var(--font-body)',
        fontSize:       `${size * 0.4}rem`,
        fontWeight:     700,
        letterSpacing:  '0.02em',
        lineHeight:     1,
        flexShrink:     0,
        userSelect:     'none',
      }}
    >
      {initials}
    </span>
  )
}