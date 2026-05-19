'use client'

import { motion } from 'framer-motion'

/**
 * Full story / Quick story toggle.
 *
 * Design (Reader___Full_story.png, top of page):
 *
 *   FULL STORY  [⚫⚫⚫⚫⚫]  QUICK STORY
 *   ↑ active    ↑ pill   ↑ inactive (muted)
 *
 * The active label gets the dark pill backdrop and white text; the inactive
 * label is muted text only, no pill. As the user toggles, the pill slides
 * between the two labels via framer-motion `layoutId` (shared element).
 *
 * Note this is NOT a segmented control with the pill containing both labels
 * inside it — the pill is between the labels and only sits behind the active
 * one. That mirrors the design rather than fighting it.
 *
 * The pill uses inline text labels so the pill width responds to the active
 * label's natural width. As a result, the inactive label is in a fixed
 * position and the pill animates between two anchors — that's the source of
 * the "slide" you see when toggling.
 */
export default function ReaderToggle({
  mode,
  onChange,
  fullLabel,
  quickLabel,
}: {
  mode:       'full' | 'quick'
  onChange:   (next: 'full' | 'quick') => void
  fullLabel:  string
  quickLabel: string
}) {
  return (
    <div
      role="tablist"
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '0.5rem',
        marginBottom:   '1.5rem',
        fontFamily:     'var(--font-body)',
        textTransform:  'uppercase',
        letterSpacing:  '0.06em',
        fontSize:       '0.8125rem',
        fontWeight:     700,
      }}
    >
      <ToggleLabel
        label={fullLabel}
        active={mode === 'full'}
        onClick={() => onChange('full')}
      />
      <ToggleLabel
        label={quickLabel}
        active={mode === 'quick'}
        onClick={() => onChange('quick')}
      />
    </div>
  )
}

function ToggleLabel({
  label,
  active,
  onClick,
}: {
  label:   string
  active:  boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        position:       'relative',
        padding:        active ? '0.5rem 1.25rem' : '0.5rem 0.25rem',
        background:     'transparent',
        border:         'none',
        color:          active ? '#FFFFFF' : 'var(--text-faint)',
        cursor:         active ? 'default' : 'pointer',
        fontFamily:     'inherit',
        fontSize:       'inherit',
        fontWeight:     'inherit',
        letterSpacing:  'inherit',
        textTransform:  'inherit',
        transition:     'color 0.2s, padding 0.2s',
      }}
    >
      {active && (
        <motion.span
          layoutId="reader-toggle-pill"
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          style={{
            position:     'absolute',
            inset:        0,
            background:   '#1A1A1A',
            borderRadius: '999rem',
            zIndex:       0,
          }}
        />
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
    </button>
  )
}