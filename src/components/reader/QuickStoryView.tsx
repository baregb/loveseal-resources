'use client'

import { useState } from 'react'

/**
 * Quick Story view — paginated card walkthrough of `summary_points[]`.
 *
 * Design (Reader___Quick_story.png):
 *
 *   ╭────────────────────────────────────────╮
 *   │  ░░░░ COVER IMAGE BAND  (top of card) ░│
 *   │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
 *   │  ╭──────────────────────────────────╮  │
 *   │  │ MARKER ONE — A SEAL ON THE TONGUE │  │
 *   │  │                                   │  │
 *   │  │ Fewer words. More fruit.          │  │
 *   │  │                                   │  │
 *   │  │ A covenanted mouth speaks slowly… │  │
 *   │  │                                   │  │
 *   │  │ 01/05                       ←  →  │  │
 *   │  ╰──────────────────────────────────╯  │
 *   ╰────────────────────────────────────────╯
 *
 * Each `summary_points[i]` is split on the first blank line:
 *   - First line  → card heading (uppercased visually)
 *   - Rest        → card body
 *
 * If a point has no blank line, the heading falls back to
 * "{pointFallbackLabel} 01" (locale-aware) and the entire string is body.
 *
 * Final-card behaviour (Q13 = b): the next arrow on the LAST card turns
 * into a "Read full story" pill that switches the parent reader to Full
 * mode. That's delegated via `onReadFull` — the parent owns the mode state.
 *
 * No looping behaviour. Hitting `→` on the last card sends to full story;
 * hitting `←` on the first card is disabled.
 */
export default function QuickStoryView({
  points,
  coverImageUrl,
  paginationLabel,
  nextLabel,
  prevLabel,
  readFullLabel,
  pointFallbackLabel,
  onReadFull,
}: {
  points:             string[]
  coverImageUrl:      string | null
  /**
   * Renders the "01/05" indicator. Receives `current` (1-indexed) and
   * `total`. Comes from the parent so locale-specific number formatting
   * is honoured.
   */
  paginationLabel:    (current: number, total: number) => string
  nextLabel:          string
  prevLabel:          string
  readFullLabel:      string
  /**
   * Used for cards lacking a heading. Receives the 1-indexed number.
   * Example return: "Point 1".
   */
  pointFallbackLabel: (n: number) => string
  /** Called when the user hits `→` on the last card. */
  onReadFull:         () => void
}) {
  const [index, setIndex] = useState(0)
  const total   = points.length
  const isFirst = index === 0
  const isLast  = index === total - 1

  if (total === 0) {
    return null
  }

  const point     = points[index]
  const { heading, body } = splitPoint(point, pointFallbackLabel(index + 1))

  function next() {
    if (isLast) onReadFull()
    else setIndex(i => Math.min(i + 1, total - 1))
  }

  function prev() {
    setIndex(i => Math.max(i - 1, 0))
  }

  return (
    <div
      style={{
        position:     'relative',
        marginBottom: '2.5rem',
      }}
    >
      {/* Cover image band — sits behind the card and shows above its top edge */}
      {coverImageUrl && (
        <div
          aria-hidden="true"
          style={{
            width:        '100%',
            aspectRatio:  '16 / 9',
            background:   `url(${coverImageUrl}) center / cover, var(--brand-gold)`,
            borderRadius: '0.75rem 0.75rem 0 0',
          }}
        />
      )}

      {/* Card body — sits on top of the cover with a negative top margin
          so the cover bleeds above it (matches the design's layered look) */}
      <div
        style={{
          position:     'relative',
          marginTop:    coverImageUrl ? '-2rem' : 0,
          padding:      '1.75rem 1.5rem 1.25rem',
          background:   'var(--bg-base)',
          border:       '0.03125rem solid var(--border-subtle)',
          borderRadius: '0.75rem',
          boxShadow:    '0 0.5rem 1.5rem rgba(0, 0, 0, 0.04)',
        }}
      >
        <h2
          style={{
            margin:         '0 0 0.875rem',
            fontFamily:     'var(--font-display), Barlow Condensed, sans-serif',
            fontSize:       'clamp(1.25rem, 3.2vw, 1.75rem)',
            fontWeight:     900,
            textTransform:  'uppercase',
            lineHeight:     1.05,
            letterSpacing:  '-0.005em',
            color:          'var(--text-primary)',
          }}
        >
          {heading}
        </h2>

        <div
          style={{
            fontFamily:  'var(--font-body)',
            fontSize:    '1rem',
            lineHeight:  1.6,
            color:       'var(--text-primary)',
            whiteSpace:  'pre-wrap',
          }}
        >
          {body}
        </div>

        {/* Pagination row — counter on left, nav on right */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            gap:            '0.75rem',
            marginTop:      '1.5rem',
            paddingTop:     '1rem',
            borderTop:      '0.03125rem solid var(--border-subtle)',
          }}
        >
          <span
            style={{
              fontFamily:    'var(--font-display), Barlow Condensed, sans-serif',
              fontSize:      '0.9375rem',
              fontWeight:    900,
              letterSpacing: '0.04em',
              color:         'var(--text-primary)',
            }}
          >
            {paginationLabel(index + 1, total)}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowButton
              direction="prev"
              ariaLabel={prevLabel}
              disabled={isFirst}
              onClick={prev}
            />

            {isLast ? (
              <ReadFullPill
                label={readFullLabel}
                onClick={onReadFull}
              />
            ) : (
              <ArrowButton
                direction="next"
                ariaLabel={nextLabel}
                disabled={false}
                onClick={next}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Helpers ────────────────────────────────────────────────────────── */

/**
 * Split a summary point into (heading, body) using the documented
 * convention: first non-empty line is the heading, everything after
 * the first blank line is the body. Plain single-line points get a
 * synthetic fallback heading.
 *
 * Examples:
 *   "MARKER ONE — A SEAL ON THE TONGUE\n\nFewer words. More fruit."
 *     → heading: "MARKER ONE — A SEAL ON THE TONGUE"
 *     → body:    "Fewer words. More fruit."
 *
 *   "Walk slowly in the morning."
 *     → heading: <fallback>
 *     → body:    "Walk slowly in the morning."
 */
function splitPoint(raw: string, fallbackHeading: string): { heading: string; body: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { heading: fallbackHeading, body: '' }

  // Look for the first blank-line separator: \n\s*\n
  const sepMatch = trimmed.match(/\n\s*\n/)
  if (sepMatch && sepMatch.index !== undefined) {
    const heading = trimmed.slice(0, sepMatch.index).trim()
    const body    = trimmed.slice(sepMatch.index + sepMatch[0].length).trim()
    if (heading && body) return { heading, body }
  }

  // No separator found — treat the whole thing as body
  return { heading: fallbackHeading, body: trimmed }
}

/* ── Subcomponents ──────────────────────────────────────────────────── */

function ArrowButton({
  direction,
  ariaLabel,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next'
  ariaLabel: string
  disabled:  boolean
  onClick:   () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={ariaLabel}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          '2.75rem',
        height:         '2.75rem',
        borderRadius:   '50%',
        background:     disabled ? 'transparent' : 'var(--bg-elevated)',
        color:          disabled ? 'var(--text-faint)' : 'var(--text-primary)',
        border:         '0.03125rem solid var(--border-subtle)',
        cursor:         disabled ? 'not-allowed' : 'pointer',
        opacity:        disabled ? 0.5 : 1,
        transition:     'background-color 0.12s, color 0.12s, opacity 0.12s',
        flexShrink:     0,
      }}
    >
      {direction === 'prev' ? <ArrowLeftIcon /> : <ArrowRightIcon />}
    </button>
  )
}

function ReadFullPill({
  label,
  onClick,
}: {
  label:   string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '0.5rem',
        padding:        '0 1.125rem',
        height:         '2.75rem',
        borderRadius:   '999rem',
        background:     'var(--footer-red, #C32126)',
        color:          '#FFFFFF',
        border:         'none',
        cursor:         'pointer',
        fontFamily:     'var(--font-body)',
        fontSize:       '0.8125rem',
        fontWeight:     600,
        letterSpacing:  '0.02em',
        textTransform:  'uppercase',
        transition:     'background-color 0.12s',
        flexShrink:     0,
        whiteSpace:     'nowrap',
      }}
    >
      <span>{label}</span>
      <ArrowRightIcon />
    </button>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5"  y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5"  y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}