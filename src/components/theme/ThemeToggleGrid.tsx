'use client'

import type { ThemeMode } from '@/components/theme/ThemeProvider'

/**
 * Stateless Light / Dark / Auto picker.
 *
 * Renders a 3-column grid of small toggle buttons matching the AdminTopbar
 * design language. State is owned by the caller — this component takes the
 * current `mode` and an `onSelectMode` callback. Use `ThemeTogglePopover`
 * for the full self-contained header-suitable variant.
 *
 * The active button gets a raised background, gold text, and a tiny shadow.
 * Inactive buttons sit on transparent. Single-line labels ("Light" / "Dark"
 * / "Auto") so the grid stays compact (~9rem wide).
 */
export default function ThemeToggleGrid({
  mode,
  onSelectMode,
  /** Optional className for the outer grid element. */
  className,
}: {
  mode:         ThemeMode
  onSelectMode: (m: ThemeMode) => void
  className?:   string
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className={className}
      style={{
        display:             'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap:                 '0.25rem',
        background:          'var(--bg-base)',
        padding:             '0.1875rem',
        borderRadius:        '0.4375rem',
        border:              '0.03125rem solid var(--border-subtle)',
      }}
    >
      <Option current={mode} value="light"  onSelect={onSelectMode} icon={<SunIcon />}     label="Light" />
      <Option current={mode} value="dark"   onSelect={onSelectMode} icon={<MoonIcon />}    label="Dark"  />
      <Option current={mode} value="system" onSelect={onSelectMode} icon={<MonitorIcon />} label="Auto"  />
    </div>
  )
}

function Option({
  current, value, onSelect, icon, label,
}: {
  current:  ThemeMode
  value:    ThemeMode
  onSelect: (v: ThemeMode) => void
  icon:     React.ReactNode
  label:    string
}) {
  const active = current === value
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={() => onSelect(value)}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '0.3125rem',
        padding:        '0.4375rem 0.25rem',
        background:     active ? 'var(--bg-raised)' : 'transparent',
        border:         'none',
        borderRadius:   '0.3125rem',
        cursor:         'pointer',
        fontFamily:     'var(--font-body)',
        fontSize:       '0.6875rem',
        fontWeight:     active ? 500 : 400,
        color:          active ? 'var(--brand-gold)' : 'var(--text-tertiary)',
        boxShadow:      active ? '0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.08)' : 'none',
        transition:     'all 0.12s',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

/* ── Icons (currentColor so they tint with the button color) ───────────── */

function SunIcon() {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24"
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
      width="13" height="13" viewBox="0 0 24 24"
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
      width="13" height="13" viewBox="0 0 24 24"
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