/**
 * Shared hero header for topic landing pages.
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ EYEBROW (gold or type-accent)                                │
 *   │                                                              │
 *   │ DISPLAY TITLE — Barlow Condensed 900, uppercase              │
 *   │                                                              │
 *   │ Optional supporting copy (one paragraph)                     │
 *   │                                                              │
 *   │ Count chip: "8 items" (muted)                                │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Used by:
 *   - `/topic/[type]/page.tsx`   (content-type filter)
 *   - `/topics/page.tsx`         (tag index)
 *   - `/topics/[slug]/page.tsx`  (single-tag filter)
 *
 * Matches the visual rhythm of the library page header (eyebrow + display
 * heading + count) so navigating type → type doesn't feel like jumping
 * between unrelated layouts.
 */

interface TopicHeaderProps {
  /** Eyebrow line above the heading (e.g. "TYPE", "TAG", "TOPICS"). */
  eyebrow:     string
  /** Display heading (uppercased server-side by CSS). */
  title:       string
  /** Optional supporting paragraph below the heading. */
  body?:       string | null
  /** Pre-formatted count label, e.g. "8 items" or "no items yet". */
  countLabel:  string
  /**
   * Optional accent colour for the eyebrow. Defaults to brand-gold to match
   * the library page. Type-specific topic pages override to their type
   * accent (red for prophecies, blue for manuals, etc.).
   */
  accentColor?: string
}

export default function TopicHeader({
  eyebrow,
  title,
  body,
  countLabel,
  accentColor = 'var(--brand-gold)',
}: TopicHeaderProps) {
  return (
    <header style={{ marginBottom: '2rem' }}>
      <p style={{
        fontSize:      '0.6875rem',     /* 11px */
        fontWeight:    500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color:         accentColor,
        margin:        '0 0 0.625rem',
        fontFamily:    'var(--font-body)',
      }}>
        {eyebrow}
      </p>

      <h1 style={{
        fontFamily:    'var(--font-display), Barlow Condensed, sans-serif',
        fontSize:      'clamp(2.25rem, 6vw, 4rem)',  /* 36px → 64px */
        fontWeight:    900,
        textTransform: 'uppercase',
        color:         'var(--text-primary)',
        lineHeight:    0.96,
        letterSpacing: '-0.02em',
        margin:        '0 0 0.5rem',
      }}>
        {title}
      </h1>

      {body && (
        <p style={{
          fontSize:   '1rem',           /* 16px */
          lineHeight: 1.6,
          color:      'var(--text-secondary)',
          /* Local cap — pulled in for a comfortable measure that's narrower
             than the page's --width-content. Not promoted to a token because
             only the topic-page intro currently uses it. */
          maxWidth:   '52ch',
          margin:     '0.75rem 0 0.875rem',
        }}>
          {body}
        </p>
      )}

      <p style={{
        fontSize: '0.875rem',           /* 14px */
        color:    'var(--text-tertiary)',
        margin:   0,
      }}>
        {countLabel}
      </p>
    </header>
  )
}