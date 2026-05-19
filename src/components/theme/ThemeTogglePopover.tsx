'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme, type ThemeMode } from '@/components/theme/ThemeProvider'
import ThemeToggleGrid from '@/components/theme/ThemeToggleGrid'

/**
 * Header-suitable wrapper around `ThemeToggleGrid`.
 *
 * Renders a single circular icon button that reflects the current resolved
 * theme (sun in light mode, moon in dark mode). Clicking opens a small
 * popover containing the full 3-button Light/Dark/Auto grid.
 *
 * Why a popover and not three inline buttons in the header: the grid is ~9rem
 * wide, which fights the LanguageSwitcher and search icon for horizontal
 * space on tablet. Tucking it behind a 2.75rem trigger keeps the header
 * balanced at every breakpoint.
 *
 * Closes on outside-click and on Escape.
 */
export default function ThemeTogglePopover({
  /** Visual variant — 'circle' (header) or 'square' (drawer). */
  variant = 'circle',
}: {
  variant?: 'circle' | 'square'
}) {
  const { mode, resolved, setMode } = useTheme()

  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  /* Close on outside click. */
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  /* Close on Escape. */
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  /* Pick an icon that reflects the user's intent:
       - mode === 'system'  → monitor (regardless of resolved value)
       - mode === 'light'   → sun
       - mode === 'dark'    → moon
     This is more honest than always tracking `resolved`: it reflects the
     user's chosen preference rather than the runtime outcome. */
  const triggerIcon = pickTriggerIcon(mode, resolved)

  const isCircle = variant === 'circle'

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Change appearance"
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          display:        'inline-flex',
          alignItems:     'center',
          justifyContent: 'center',
          width:          '2.75rem',
          height:         '2.75rem',
          borderRadius:   isCircle ? '50%' : '0.5rem',
          background:     open ? 'var(--bg-elevated)' : 'transparent',
          border:         '0.03125rem solid var(--border-strong)',
          color:          'var(--text-primary)',
          cursor:         'pointer',
          flexShrink:     0,
          transition:     'background-color 0.12s',
        }}
      >
        {triggerIcon}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Appearance"
          style={{
            position:      'absolute',
            top:           'calc(100% + 0.375rem)',
            /* Right-align under the trigger in LTR; flips automatically
               under RTL because of `insetInlineEnd`. */
            insetInlineEnd: 0,
            minWidth:      '12.5rem',
            background:    'var(--bg-raised)',
            border:        '0.03125rem solid var(--border-strong)',
            borderRadius:  '0.625rem',
            padding:       '0.5rem',
            boxShadow:     '0 0.625rem 2rem rgba(0, 0, 0, 0.15)',
            zIndex:        200,
          }}
        >
          <div
            style={{
              padding:       '0.25rem 0.375rem 0.5rem',
              fontSize:      '0.6875rem',
              fontWeight:    600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color:         'var(--text-tertiary)',
              fontFamily:    'var(--font-body)',
            }}
          >
            Appearance
          </div>
          <ThemeToggleGrid
            mode={mode}
            onSelectMode={(m: ThemeMode) => {
              setMode(m)
              /* Stay open after selection — matches AdminTopbar behaviour
                 and lets the user toggle between options without reopening. */
            }}
          />
        </div>
      )}
    </div>
  )
}

function pickTriggerIcon(mode: ThemeMode, resolved: 'light' | 'dark') {
  if (mode === 'system') return <MonitorIcon />
  if (mode === 'dark')   return <MoonIcon />
  if (mode === 'light')  return <SunIcon />
  /* Defensive fallback — should be unreachable. */
  return resolved === 'dark' ? <MoonIcon /> : <SunIcon />
}

/* ── Icons (slightly larger than the grid icons for header visibility) ── */

function SunIcon() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false"
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12"   y1="2"    x2="12"   y2="4" />
      <line x1="12"   y1="20"   x2="12"   y2="22" />
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <line x1="2"    y1="12"   x2="4"    y2="12" />
      <line x1="20"   y1="12"   x2="22"   y2="12" />
      <line x1="4.93"  y1="19.07" x2="6.34"  y2="17.66" />
      <line x1="17.66" y1="6.34"  x2="19.07" y2="4.93" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function MonitorIcon() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8"  y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}