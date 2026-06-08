'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import BrandLogo from '@/components/brand/BrandLogo'
import LanguageSwitcher from '@/components/public/LanguageSwitcher'
import ThemeTogglePopover from '@/components/theme/ThemeTogglePopover'
import ThemeToggleGrid from '@/components/theme/ThemeToggleGrid'
import { useTheme } from '@/components/theme/ThemeProvider'

/* ─────────────────────────────────────────────────────────────────────────────
   Header structure (desktop):

       [logo tile] [date]    [─── nav pill ───]    [theme] [language] [search]

   Tablet (881–1024px): date hides, everything else stays.
   Mobile (≤880px):     nav pill hides, hamburger appears. Theme + language
                        appear inside the inline drawer alongside the nav
                        links. The Pass 6 menu overlay will replace the
                        inline drawer.

   The nav pill uses class-based hover states so `:hover` actually fires —
   inline styles don't support pseudo-classes. See the <style> block at
   the bottom of the component.

   Pass 4 change: active link's animated pill backdrop is now red
   (var(--footer-red), reused from the footer's red token since both
   resolve to #C32126), and the active label's weight bumps to 600 to
   match the design.  Previously it was a subtle #2A2A2A sub-pill on the
   dark base which read as nearly-invisible — the design called for a
   high-contrast brand-red marker.

   Pass 5b change: nav targets the new /topic/[type] route. Slug values
   are now singular content_type enum strings (manual / prophecy /
   article / blog) so the page can pass the param straight to
   `.eq('content_type', ...)` without any translation layer. The display
   labels stay plural because that's how the header reads.
   ───────────────────────────────────────────────────────────────────────── */

export default function PublicHeader() {
  const t        = useTranslations('nav')
  const locale   = useLocale()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)
  const [now,        setNow]        = useState<Date | null>(null)

  /* Live date stamp. Server starts with null; the client sets `new Date()`
     on mount, then ticks every 60s. Setting on mount instead of at render
     prevents an SSR/CSR hydration mismatch — the server has no concept of
     "now" and would otherwise mismatch the client. */
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  /* Nav links — built each render so the locale switch refreshes labels.
     Pass 5b: routes to /topic/[type] with singular type slugs. */
  const navLinks = [
    { href: '/' as const,                                                                  label: t('whatsNew') },
    { href: { pathname: '/topic/[type]' as const, params: { type: 'manual'   } }, label: t('manuals') },
    { href: { pathname: '/topic/[type]' as const, params: { type: 'prophecy' } }, label: t('prophecies') },
    { href: { pathname: '/topic/[type]' as const, params: { type: 'article'  } }, label: t('articles') },
    { href: { pathname: '/topic/[type]' as const, params: { type: 'blog'     } }, label: t('blog') },
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
      const expected = `/topic/${href.params.type}`
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
        position:       'sticky',
        top:            0,
        zIndex:         100,
        background:     'var(--bg-base)',
        borderBottom:   scrolled ? '0.03125rem solid var(--border-subtle)' : '0.03125rem solid transparent',
        transition:     'border-color 0.18s, backdrop-filter 0.18s',
        backdropFilter: scrolled ? 'blur(0.75rem)' : 'none',
      }}>
        <div
          className="public-header-grid"
          style={{
            maxWidth:            'var(--width-site)',
            marginInline:        'auto',
            width:               '100%',
            padding:             '1rem var(--page-inline-padding)',
            display:             'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems:          'center',
            gap:                 '1.25rem',
          }}
        >
          {/* ── LEFT: logo + date ──────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 0 }}>
            <Link
              href="/"
              aria-label={t('home')}
              style={{ display: 'block', textDecoration: 'none', flexShrink: 0 }}
            >
              <BrandLogo size={48} />
            </Link>
            <span
              className="header-date"
              style={{
                fontFamily:    'var(--font-body)',
                fontSize:      '0.75rem',
                fontWeight:    500,
                letterSpacing: '0.12em',
                color:         'var(--text-primary)',
                whiteSpace:    'nowrap',
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
              justifySelf:   'center',
              display:       'flex',
              gap:           '0.25rem',
              background:    '#1A1A1A',
              borderRadius:  '999rem',
              padding:       '0.5rem 0.75rem',
            }}
          >
            {navLinks.map((link, idx) => {
              const active = isLinkActive(link.href)
              return (
                <Link
                  key={idx}
                  href={link.href}
                  className={`public-nav-link${active ? ' public-nav-link--active' : ''}`}
                  style={{
                    position:       'relative',
                    padding:        '0.5rem 1.125rem',
                    borderRadius:   '999rem',
                    fontFamily:     'var(--font-body)',
                    fontSize:       '0.875rem',
                    fontWeight:     active ? 600 : 400,
                    color:          active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                    textDecoration: 'none',
                    whiteSpace:     'nowrap',
                    transition:     'color 0.18s',
                  }}
                >
                  {/* Animated active indicator. `layoutId` makes framer-motion
                      animate the pill between active items as the route
                      changes — sliding + resizing as one shared element.
                      Rendering it only on the active link is the trick that
                      drives the animation: when `active` flips between
                      links, framer-motion sees the source-element-vs-target-
                      element diff and tweens between them.

                      Pass 4: the pill backdrop is now red, taken from
                      var(--footer-red) which is theme-independent. That
                      token resolves to #C32126 (firebrick) — matches the
                      design's brand-red active marker. */}
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      style={{
                        position:     'absolute',
                        inset:        0,
                        background:   'var(--footer-red, #C32126)',
                        borderRadius: '999rem',
                        zIndex:       0,
                      }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* ── RIGHT: theme · language · search · (mobile) hamburger ── */}
          <div
            className="public-header-right"
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '0.5rem',
              justifyContent: 'flex-end',
            }}
          >
            <span className="public-header-theme">
              <ThemeTogglePopover />
            </span>

            <span className="public-header-language">
              <LanguageSwitcher />
            </span>

            <Link
              href="/content"
              title={t('search')}
              aria-label={t('search')}
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                justifyContent: 'center',
                width:          '2.75rem',
                height:         '2.75rem',
                borderRadius:   '50%',
                background:     '#1A1A1A',
                color:          '#FFFFFF',
                textDecoration: 'none',
                flexShrink:     0,
                transition:     'transform 0.12s',
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
                width:        '2.75rem',
                height:       '2.75rem',
                borderRadius: '50%',
                background:   mobileOpen ? '#1A1A1A' : 'transparent',
                color:        mobileOpen ? '#FFFFFF' : 'var(--text-primary)',
                border:       '0.03125rem solid var(--border-strong)',
                cursor:       'pointer',
                /* Hidden by default; the responsive style block enables it below 880px. */
                display:        'none',
                alignItems:     'center',
                justifyContent: 'center',
                fontFamily:     'var(--font-body)',
                flexShrink:     0,
              }}
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile inline drawer — placeholder until Pass 6 ships the full overlay */}
        {mobileOpen && <MobileDrawer navLinks={navLinks} />}
      </header>

      <style>{`
        /* Nav pill hover — only inactive items lighten; the active item stays
           white. Inline styles can't define :hover, hence this stylesheet. */
        .public-nav-link:hover {
          color: rgba(255, 255, 255, 0.85) !important;
        }
        .public-nav-link--active,
        .public-nav-link--active:hover {
          color: #FFFFFF !important;
        }

        /* Tablet — hide the long date, everything else stays in the right cluster */
        @media (max-width: 64rem) {
          .public-header-grid {
            grid-template-columns: auto 1fr auto !important;
            gap: 0.75rem !important;
          }
          .header-date { display: none !important; }
        }

        /* Mobile — collapse the nav pill, move theme + language into the drawer */
        @media (max-width: 55rem) {
          .public-nav-pill        { display: none !important; }
          .public-nav-hamburger   { display: inline-flex !important; }
          .public-header-theme,
          .public-header-language { display: none !important; }
        }
      `}</style>
    </>
  )
}

/* Drawer content extracted so the parent component stays readable. Renders
   the nav links, then a divider, then the inline ThemeToggleGrid (no popover
   needed in a drawer), then the LanguageSwitcher. */
function MobileDrawer({
  navLinks,
}: {
  navLinks: ReadonlyArray<{
    href:  string | { pathname: string; params: { type: string } }
    label: string
  }>
}) {
  const { mode, setMode } = useTheme()

  return (
    <div style={{
      background: 'var(--bg-base)',
      borderTop:  '0.03125rem solid var(--border-subtle)',
      padding:    '0.75rem var(--page-inline-padding) 1.25rem',
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
        {navLinks.map((link, idx) => (
          <Link
            key={idx}
            // @ts-expect-error -- the typed Link's `href` union narrows
            // differently here than the parent's; the runtime shape is
            // identical so this passthrough is safe.
            href={link.href}
            style={{
              padding:        '0.75rem 1rem',
              borderRadius:   '0.5rem',
              fontFamily:     'var(--font-body)',
              fontSize:       '0.9375rem',
              color:          'var(--text-primary)',
              background:     'transparent',
              textDecoration: 'none',
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div
        aria-hidden="true"
        style={{
          height:     '0.03125rem',
          background: 'var(--border-subtle)',
          margin:     '0.875rem 0',
        }}
      />

      <div style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '0.75rem',
      }}>
        <ThemeToggleGrid mode={mode} onSelectMode={setMode} />
        <LanguageSwitcher />
      </div>
    </div>
  )
}

/* ── Icons ── */

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
  )
}