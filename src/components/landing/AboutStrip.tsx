'use client'

import { useTranslations } from 'next-intl'
import { BRAND } from '@/components/brand/Brand'
import RevealOnScroll from './RevealOnScroll'

export default function AboutStrip() {
  const t = useTranslations('about')

  return (
    <section style={{
      /* Centered section, capped at --width-content (1280px). Horizontal
         padding from --page-inline-padding so the section's edges align
         with the rest of the site chrome below the cap; on viewports
         wider than 1280px the side margin grows naturally. */
      maxWidth: 'var(--width-content)',
      margin:   '0 auto',
      padding:  '5rem var(--page-inline-padding)',
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
            /* Component-local headline cap (~900px). Not promoted to a
               global token because no other component shares this need;
               adding `--width-headline` for a single consumer is overkill. */
            maxWidth: '56.25rem',
          }}>
            {t.rich('headline', {
              /* next-intl v4: rich-tag callbacks receive the inner content
                 as `chunks` and must wrap it. The message uses
                 <highlight>…</highlight> as a rich-text tag. */
              highlight: (chunks) => (
                <span style={{ color: 'var(--brand-gold)' }}>{chunks}</span>
              ),
            })}
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            maxWidth: 'var(--width-narrow)',
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