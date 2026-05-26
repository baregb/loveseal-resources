'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandName } from '@/components/brand/Brand'

const baseNavLinks = [
  { href: '/admin',                 label: 'Dashboard',     icon: HomeIcon            },
  { href: '/admin/content',         label: 'Content',       icon: ContentIcon         },
  { href: '/admin/upload',          label: 'Upload',        icon: UploadIcon          },
  { href: '/admin/authors',         label: 'Authors',       icon: AuthorsIcon         },
  { href: '/admin/categories',      label: 'Categories',    icon: CategoriesIcon      },
  { href: '/admin/editorial-tags',  label: 'In-focus tags', icon: EditorialTagsIcon   },
]

const superAdminNavLinks = [
  { href: '/admin/admins',     label: 'Admins',     icon: AdminsIcon     },
]

export default function AdminSidebar({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const router    = useRouter()
  const pathname  = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted]     = useState(false)

  const navLinks = isSuperAdmin ? [...baseNavLinks, ...superAdminNavLinks] : baseNavLinks

  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
    setMounted(true)
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('admin-sidebar-collapsed', String(next))
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  if (!mounted) {
    return <aside style={{ width: '220px', flexShrink: 0 }} />
  }

  const width = collapsed ? '64px' : '220px'

  return (
    <aside
      style={{
        width,
        flexShrink: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '0.5px solid var(--border-subtle)',
        height: '100dvh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.18s ease',
        overflow: 'visible',
        zIndex: 50, // sits above topbar so the toggle can poke out
      }}
    >
      {/* Collapse toggle — small floating circle on the right edge */}
      <button
        onClick={toggleCollapsed}
        title={collapsed ? 'Expand' : 'Collapse'}
        style={{
          position: 'absolute',
          top: '24px',
          right: '-9px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'var(--bg-elevated)',
          border: '0.5px solid var(--border-strong)',
          color: 'var(--text-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 100,
          padding: 0,
          transition: 'background 0.12s, color 0.12s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#F5AE41'
          e.currentTarget.style.color      = '#212529'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--bg-elevated)'
          e.currentTarget.style.color      = 'var(--text-tertiary)'
        }}
      >
        <svg
          width="9" height="9" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round"
          style={{
            transform: collapsed ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.18s',
          }}
        >
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      {/* Logo */}
      <div style={{
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0' : '0 18px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: '0.5px solid var(--border-subtle)',
      }}>
        {collapsed ? (
          <span style={{
            fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
            fontSize: '16px',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--brand-gold)',
            letterSpacing: '0.04em',
          }}>
            LR
          </span>
        ) : (
          <BrandName size="sm" color="var(--brand-gold)" stacked />
        )}
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1,
        padding: '14px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}>
        {navLinks.map(link => {
          const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '10px' : '9px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '7px',
                fontSize: '13px',
                fontWeight: active ? 500 : 400,
                color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                background: active ? 'var(--bg-elevated)' : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.12s, color 0.12s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <Icon style={{
                flexShrink: 0,
                color: active ? 'var(--brand-gold)' : 'var(--text-muted)',
              }} />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div style={{
        padding: '10px',
        borderTop: '0.5px solid var(--border-subtle)',
      }}>
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : ''}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: collapsed ? '10px' : '9px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: 'transparent',
            border: 'none',
            borderRadius: '7px',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-tertiary)',
            transition: 'background 0.12s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            width: '100%',
            textAlign: 'left',
            fontSize: '12px',
          }}
        >
          <SignOutIcon />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}

/* ── Icons ── */

function HomeIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function ContentIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  )
}
function UploadIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}
function CategoriesIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="8" y1="6"  x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6"  x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  )
}
function AdminsIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function AuthorsIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
function EditorialTagsIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  )
}
function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}