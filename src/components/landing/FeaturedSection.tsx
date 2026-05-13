'use client'

import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import RevealOnScroll from './RevealOnScroll'

interface FeaturedItem {
  id:              string
  title:           string
  content_type:    'manual' | 'prophecy' | 'article' | 'blog'
  theme:           string | null
  speaker:         string | null
  date_preached:   string | null
  cover_image_url: string | null
  created_at:      string
}

const TYPE_COLORS: Record<string, string> = {
  manual: '#4498CC', prophecy: '#C32126', article: '#F5AE41', blog: '#3C3C3C',
}

export default function FeaturedSection({ items }: { items: FeaturedItem[] }) {
  const t      = useTranslations('featured')
  const tTypes = useTranslations('content.types')
  const locale = useLocale()

  if (items.length === 0) return null

  const [primary, ...rest] = items
  const secondary = rest.slice(0, 4)

  return (
    <section style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 24px 80px',
    }}>
      <RevealOnScroll>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '24px',
          paddingBottom: '14px',
          borderBottom: '0.5px solid var(--border-subtle)',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            {t('title')}
          </h2>
          <Link href="/content" style={{
            fontSize: '13px',
            color: 'var(--brand-gold)',
            textDecoration: 'none',
            fontWeight: 500,
          }}>
            {t('allContent')} →
          </Link>
        </div>
      </RevealOnScroll>

      <div className="featured-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '20px',
      }}>
        <RevealOnScroll delay={0.05}>
          <PrimaryCard item={primary} typeLabel={tTypes(primary.content_type)} locale={locale} />
        </RevealOnScroll>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {secondary.map((item, idx) => (
            <RevealOnScroll key={item.id} delay={0.1 + idx * 0.05}>
              <SecondaryCard item={item} typeLabel={tTypes(item.content_type)} locale={locale} />
            </RevealOnScroll>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .featured-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

function PrimaryCard({ item, typeLabel, locale }: { item: FeaturedItem; typeLabel: string; locale: string }) {
  const typeColor = TYPE_COLORS[item.content_type]
  const date = item.date_preached
    ? new Date(item.date_preached).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date(item.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Link
      href={{ pathname: '/content/[id]', params: { id: item.id } }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-raised)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: '16px',
        overflow: 'hidden',
        textDecoration: 'none',
        height: '100%',
        minHeight: '460px',
      }}
    >
      <div style={{
        flex: 1.4,
        position: 'relative',
        background: item.cover_image_url
          ? undefined
          : `linear-gradient(135deg, ${typeColor}55 0%, ${typeColor}11 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '240px',
      }}>
        {item.cover_image_url ? (
          /* Primary card spans 1.4fr of a 1200px max-width column → ~600px wide
             on desktop, full width on mobile. */
          <Image
            src={item.cover_image_url}
            alt=""
            fill
            sizes="(max-width: 820px) 100vw, 600px"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '72px', opacity: 0.35 }}>
            {item.content_type === 'manual'    ? '📘'
             : item.content_type === 'prophecy' ? '🕊'
             : item.content_type === 'article'  ? '📄'
             : '✍'}
          </span>
        )}
        <span style={{
          position: 'absolute',
          top: '16px',
          insetInlineStart: '16px',
          background: typeColor,
          color: '#FFFFFF',
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: '4px 11px',
          borderRadius: '999px',
          zIndex: 1,
        }}>
          {typeLabel}
        </span>
      </div>
      <div style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {item.theme && (
          <div style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            {item.theme}
          </div>
        )}
        <h3 style={{
          fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
          fontSize: 'clamp(24px, 3vw, 32px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 1.05,
          letterSpacing: '-0.01em',
          margin: 0,
        }}>
          {item.title}
        </h3>
        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          {item.speaker && <span>{item.speaker} · </span>}
          <span>{date}</span>
        </div>
      </div>
    </Link>
  )
}

function SecondaryCard({ item, typeLabel, locale }: { item: FeaturedItem; typeLabel: string; locale: string }) {
  const typeColor = TYPE_COLORS[item.content_type]
  const date = item.date_preached
    ? new Date(item.date_preached).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
    : new Date(item.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' })

  return (
    <Link
      href={{ pathname: '/content/[id]', params: { id: item.id } }}
      style={{
        display: 'grid',
        gridTemplateColumns: '88px 1fr',
        gap: '14px',
        background: 'var(--bg-raised)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: '12px',
        textDecoration: 'none',
        overflow: 'hidden',
        padding: '12px',
        alignItems: 'center',
      }}
    >
      <div style={{
        position: 'relative',
        width: '88px',
        height: '88px',
        borderRadius: '10px',
        overflow: 'hidden',
        background: item.cover_image_url
          ? undefined
          : `linear-gradient(135deg, ${typeColor}33 0%, ${typeColor}0a 100%)`,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {item.cover_image_url ? (
          <Image
            src={item.cover_image_url}
            alt=""
            fill
            sizes="88px"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '32px', opacity: 0.4 }}>
            {item.content_type === 'manual'    ? '📘'
             : item.content_type === 'prophecy' ? '🕊'
             : item.content_type === 'article'  ? '📄'
             : '✍'}
          </span>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          display: 'inline-block',
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: typeColor,
          marginBottom: '4px',
        }}>
          {typeLabel}
        </div>
        <h4 style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--text-primary)',
          marginBottom: '4px',
          lineHeight: 1.3,
          textTransform: 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {item.title}
        </h4>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {item.speaker && <span>{item.speaker} · </span>}
          <span>{date}</span>
        </div>
      </div>
    </Link>
  )
}