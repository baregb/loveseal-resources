'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import BrandLogo from '@/components/brand/BrandLogo'

/* ─────────────────────────────────────────────────────────────────────────────
   Header structure (desktop):

       [logo tile] [date]            [─── nav pill ───]            [search]

   Mobile (≤880px): logo + search + hamburger. Date hidden, pill collapses
   into the inline drawer until Pass 6 ships the proper Menu Overlay.
   ───────────────────────────────────────────────────────────────────────── */

export default function PublicHeader() {
  const t        = useTranslations('nav')
  const locale   = useLocale()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)
  const [now,        setNow]        = useState<Date | null>(null)

  /* Live date stamp. We start with null (server) and set to `new Date()` on
     mount, then tick every 60s. Setting on mount instead of at render time
     prevents an SSR/CSR hydration mismatch — the server has no concept of
     "now" and would otherwise mismatch the client. */
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  /* Nav links — built each render so the locale switch refreshes labels. */
  const navLinks = [
    { href: '/' as const,                              label: t('whatsNew') },
    { href: { pathname: '/topic/[slug]' as const, params: { slug: 'manuals' } },    label: t('manuals') },
    { href: { pathname: '/topic/[slug]' as const, params: { slug: 'prophecies' } }, label: t('prophecies') },
    { href: { pathname: '/topic/[slug]' as const, params: { slug: 'articles' } },   label: t('articles') },
    { href: { pathname: '/topic/[slug]' as const, params: { slug: 'blog' } },       label: t('blog') },
  ]

  useEffect(() => {
    function handleScroll() { setScrolled(window.scrollY > 8) }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /* Close the mobile drawer on route change. */
  useEffect(() => { setMobileOpen(false) }, [pathname])

  function isLinkActive(href: typeof navLinks[number]['href']): boolean {
    if (typeof href === 'string') return pathname === href
    if (href && typeof href === 'object' && 'params' in href) {
      const expected = `/topic/${href.params.slug}`
      return pathname === expected
    }
    return false
  }

  const dateString = now
    ? now.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()
    : ''

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
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '16px 28px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '20px',
        }}
        className="public-header-grid"
        >
          {/* ── LEFT: logo + date ──────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minWidth: 0 }}>
            <Link href="/" aria-label={t('home')} style={{ display: 'block', textDecoration: 'none', flexShrink: 0 }}>
              <BrandLogo size={48} />
            </Link>
            <span
              className="header-date"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
              }}
              suppressHydrationWarning
            >
              {dateString}
            </span>
          </div>

          {/* ── CENTER: dark nav pill ─────────────────────────────────── */}
          <nav
            className="public-nav-pill"
            style={{
              justifySelf: 'center',
              display: 'flex',
              gap: '4px',
              background: '#1A1A1A',
              borderRadius: '999px',
              padding: '8px 12px',
            }}
          >
            {navLinks.map((link, idx) => {
              const active = isLinkActive(link.href)
              return (
                <Link
                  key={idx}
                  href={link.href}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '999px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: active ? 500 : 400,
                    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                    textDecoration: 'none',
                    transition: 'color 0.12s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* ── RIGHT: search icon + (mobile) hamburger ───────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
            <Link
              href="/content"
              title={t('search')}
              aria-label={t('search')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#1A1A1A',
                color: '#FFFFFF',
                textDecoration: 'none',
                flexShrink: 0,
                transition: 'transform 0.12s',
              }}
            >
              <SearchIcon />
            </Link>

            <button
              type="button"
              className="public-nav-hamburger"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={t('menu')}
              aria-expanded={mobileOpen}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: mobileOpen ? '#1A1A1A' : 'transparent',
                color: mobileOpen ? '#FFFFFF' : 'var(--text-primary)',
                border: '0.5px solid var(--border-strong)',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-body)',
                flexShrink: 0,
              }}
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile inline drawer — placeholder until Pass 6 ships the full overlay */}
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
                    fontFamily: 'var(--font-body)',
                    fontSize: '15px',
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
        @media (max-width: 1024px) {
          .public-header-grid    { grid-template-columns: auto 1fr auto !important; gap: 12px !important; }
          .header-date           { display: none !important; }
        }
        @media (max-width: 880px) {
          .public-nav-pill       { display: none !important; }
          .public-nav-hamburger  { display: inline-flex !important; }
        }
      `}</style>
    </>
  )
}

/* ── Icons ── */

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6"  x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
  )
}