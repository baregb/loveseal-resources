'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { LOCALES_META, routing } from '@/i18n/routing'
import type { AppLocale } from '@/i18n/routing'

export default function LanguageSwitcher() {
  const t        = useTranslations('languageSwitcher')
  const locale   = useLocale() as AppLocale
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen]     = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function changeLocale(next: AppLocale) {
    setOpen(false)
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  const current = LOCALES_META[locale]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title={t('label')}
        aria-label={t('current')}
        disabled={isPending}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          height: '34px',
          background: open ? 'var(--bg-elevated)' : 'transparent',
          border: '0.5px solid var(--border-subtle)',
          borderRadius: '999px',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          color: 'var(--text-tertiary)',
          transition: 'background 0.12s, color 0.12s',
        }}
      >
        <span style={{ fontSize: '14px' }}>{current.flag}</span>
        <span style={{ fontWeight: 500, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {locale}
        </span>
        <ChevronDown open={open} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          /* In LTR: dropdown's right edge aligns with trigger's right edge.
             In RTL: dropdown's left edge aligns with trigger's left edge.
             Both render *inside* the viewport — that's what we want. */
          insetInlineEnd: 0,
          minWidth: '180px',
          background: 'var(--bg-raised)',
          border: '0.5px solid var(--border-strong)',
          borderRadius: '10px',
          padding: '4px',
          boxShadow: '0 10px 32px rgba(0,0,0,0.15)',
          zIndex: 200,
        }}>
          {routing.locales.map((loc) => {
            const meta     = LOCALES_META[loc]
            const isActive = loc === locale
            return (
              <button
                key={loc}
                onClick={() => changeLocale(loc as AppLocale)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '8px 12px',
                  background: isActive ? 'rgba(245,174,65,0.10)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  color: isActive ? 'var(--brand-gold)' : 'var(--text-secondary)',
                  textAlign: 'start',
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <span style={{ fontSize: '15px' }}>{meta.flag}</span>
                <span style={{ flex: 1 }}>{meta.native}</span>
                {isActive && <span style={{ fontSize: '12px' }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="11" height="11" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{
        transform: open ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.18s',
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}