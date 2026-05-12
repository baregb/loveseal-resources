'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { BrandName } from '@/components/brand/Brand'
import { useTheme } from '@/components/theme/ThemeProvider'
import LanguageSwitcher from './LanguageSwitcher'

export default function PublicHeader() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const { mode, setMode, resolved } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)

  // Build nav links with translated labels (computed each render so locale switches refresh)
  const navLinks = [
    { href: '/' as const,                                                     label: t('home') },
    { href: '/content' as const,                                              label: t('all') },
    { href: { pathname: '/content', query: { type: 'manual' } },              label: t('manuals') },
    { href: { pathname: '/content', query: { type: 'prophecy' } },            label: t('prophecies') },
    { href: { pathname: '/content', query: { type: 'article' } },             label: t('articles') },
    { href: { pathname: '/content', query: { type: 'blog' } },                label: t('blog') },
  ]

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  function cycleTheme() {
    const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'
    setMode(next)
  }

  function isLinkActive(href: typeof navLinks[number]['href']): boolean {
    if (typeof href === 'string') {
      return pathname === href || (href !== '/' && pathname?.startsWith(href as string))
    }
    if (typeof window !== 'undefined') {
      return (
        pathname === href.pathname &&
        new URLSearchParams(window.location.search).get('type') === href.query.type
      )
    }
    return false
  }

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--bg-base)',
        borderBottom: scrolled ? '0.5px solid var(--border-subtle)' : '0.5px solid transparent',
        transition: 'border-color 0.18s, backdrop-filter 0.18s',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <BrandName size="sm" color="var(--text-primary)" />
          </Link>

          <nav className="public-nav-desktop" style={{ display: 'flex', gap: '4px', flex: 1, justifyContent: 'center' }}>
            {navLinks.map((link, idx) => {
              const isActive = isLinkActive(link.href)
              return (
                <Link
                  key={idx}
                  href={link.href}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '7px',
                    fontSize: '13px',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    background: isActive ? 'var(--bg-elevated)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'background 0.12s, color 0.12s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <Link
              href="/content"
              title={t('search')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                color: 'var(--text-tertiary)',
                background: 'transparent',
                textDecoration: 'none',
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              <SearchIcon />
            </Link>

            <LanguageSwitcher />

            <button
              onClick={cycleTheme}
              title={`Theme: ${mode}`}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {resolved === 'dark' ? <MoonIcon /> : <SunIcon />}
            </button>

            <button
              className="public-nav-hamburger"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={t('menu')}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: mobileOpen ? 'var(--bg-elevated)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div style={{
            background: 'var(--bg-base)',
            borderTop: '0.5px solid var(--border-subtle)',
            padding: '12px 24px 20px',
          }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {navLinks.map((link, idx) => (
                <Link
                  key={idx}
                  href={link.href}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    textDecoration: 'none',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <style>{`
        @media (max-width: 880px) {
          .public-nav-desktop   { display: none !important; }
          .public-nav-hamburger { display: inline-flex !important; }
        }
      `}</style>
    </>
  )
}

/* ── Icons ── */

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6"  x2="6"  y2="18"/>
      <line x1="6"  y1="6"  x2="18" y2="18"/>
    </svg>
  )
}
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="4"/>
      <line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/>
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="4" y2="12"/>
      <line x1="20" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/>
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}
