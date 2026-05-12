'use client'

import { useTranslations } from 'next-intl'
import { BRAND } from '@/components/brand/Brand'
import RevealOnScroll from './RevealOnScroll'

export default function AboutStrip() {
  const t = useTranslations('about')

  return (
    <section style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '80px 24px',
    }}>
      <div style={{
        background: 'var(--bg-raised)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: '20px',
        padding: 'clamp(36px, 6vw, 72px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background accent */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          insetInlineEnd: '-80px',
          width: '320px',
          height: '320px',
          background: 'var(--brand-gold)',
          opacity: 0.06,
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        <RevealOnScroll>
          <p style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--brand-gold)',
            marginBottom: '20px',
          }}>
            {t('eyebrow')}
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.05}>
          <p style={{
            fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
            fontSize: 'clamp(28px, 4.4vw, 48px)',
            fontWeight: 700,
            lineHeight: 1.1,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.015em',
            marginBottom: '24px',
            maxWidth: '900px',
          }}>
            {t.rich('headline', {
              highlight: () => (
                <span style={{ color: 'var(--brand-gold)' }}>{t('highlight')}</span>
              ),
            })}
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            maxWidth: '640px',
            marginBottom: '28px',
          }}>
            {t('body', { parent: BRAND.parent })}
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.15}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '24px',
            marginTop: '40px',
            paddingTop: '32px',
            borderTop: '0.5px solid var(--border-subtle)',
          }}>
            <ValueStat number="4" label={t('stats.types')} />
            <ValueStat number="5" label={t('stats.languages')} />
            <ValueStat number="∞" label={t('stats.readable')} />
            <ValueStat number="0" label={t('stats.cost')} />
          </div>
        </RevealOnScroll>
      </div>
    </section>
  )
}

function ValueStat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
        fontSize: 'clamp(36px, 5vw, 56px)',
        fontWeight: 900,
        color: 'var(--brand-gold)',
        lineHeight: 1,
        marginBottom: '6px',
        letterSpacing: '-0.02em',
      }}>
        {number}
      </div>
      <div style={{
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-tertiary)',
      }}>
        {label}
      </div>
    </div>
  )
}
