'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from '@/components/theme/ThemeProvider'
import ThemeToggleGrid from '@/components/theme/ThemeToggleGrid'

export default function AdminTopbar({
  userEmail,
}: {
  userEmail: string
}) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)
  const { mode, setMode } = useTheme()

  const localPart = userEmail.split('@')[0] ?? ''
  const name      = localPart
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
  const initials  = name
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header style={{
      height: '60px',
      borderBottom: '0.5px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 24px',
      background: 'var(--topbar-bg)',
      position: 'sticky',
      top: 0,
      zIndex: 5,  // below the sidebar collapse toggle (z=100)
    }}>
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '5px 8px 5px 5px',
            background: open ? 'var(--bg-elevated)' : 'transparent',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'background 0.12s',
          }}
        >
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F5AE41 0%, #C32126 100%)',
            color: '#212529',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{name}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{userEmail}</div>
          </div>
          <ChevronIcon open={open} />
        </button>

        {open && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            minWidth: '240px',
            background: 'var(--bg-raised)',
            border: '0.5px solid var(--border-strong)',
            borderRadius: '10px',
            padding: '6px',
            boxShadow: '0 10px 32px rgba(0,0,0,0.18)',
          }}>
            {/* Profile heading */}
            <div style={{
              padding: '10px 12px',
              borderBottom: '0.5px solid var(--border-subtle)',
              marginBottom: '4px',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{userEmail}</div>
            </div>

            {/* Theme switcher */}
            <div style={{ padding: '6px 12px 4px' }}>
              <div style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}>
                Appearance
              </div>
              <ThemeToggleGrid mode={mode} onSelectMode={setMode} />
            </div>

            <div style={{ height: '0.5px', background: 'var(--border-subtle)', margin: '6px 0' }} />

            <Link href="/admin/settings"  style={dropdownItemStyle}>Account settings</Link>
            <a href="/" target="_blank" rel="noopener noreferrer" style={dropdownItemStyle}>
              View public site ↗
            </a>
          </div>
        )}
      </div>
    </header>
  )
}

const dropdownItemStyle: React.CSSProperties = {
  display: 'block',
  padding: '8px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontFamily: 'var(--font-body)',
}

/* ── Icons ── */

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="var(--text-tertiary)" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{
        transform: open ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.18s',
        flexShrink: 0,
        marginLeft: '4px',
      }}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}