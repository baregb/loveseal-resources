'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { BRAND } from '@/components/brand/Brand'

interface HeroItem {
  id:              string
  title:           string
  content_type:    'manual' | 'prophecy' | 'article' | 'blog'
  theme:           string | null
  speaker:         string | null
  cover_image_url: string | null
  created_at:      string
}

const TYPE_COLORS: Record<string, string> = {
  manual:   '#4498CC',
  prophecy: '#C32126',
  article:  '#F5AE41',
  blog:     '#3C3C3C',
}

const TYPE_ORDER: HeroItem['content_type'][] = ['manual', 'prophecy', 'article', 'blog']

export default function LandingHero({ items }: { items: HeroItem[] }) {
  const t       = useTranslations('hero')
  const tNav    = useTranslations('nav')
  const tTypes  = useTranslations('content.types')
  const locale  = useLocale()

  const [activeIdx, setActiveIdx]   = useState(0)
  const [showHint, setShowHint]     = useState(true)
  const cardCount = items.length

  useEffect(() => {
    if (activeIdx > 0) setShowHint(false)
  }, [activeIdx])

  useEffect(() => {
    if (!showHint || cardCount <= 1) return
    const timer = setTimeout(() => setActiveIdx((i) => (i + 1) % cardCount), 6000)
    return () => clearTimeout(timer)
  }, [activeIdx, showHint, cardCount])

  function handleDragEnd(_: unknown, info: PanInfo) {
    const swipe = info.offset.x
    if (Math.abs(swipe) < 60) return
    setShowHint(false)
    if (swipe < 0) {
      setActiveIdx((i) => (i + 1) % cardCount)
    } else {
      setActiveIdx((i) => (i - 1 + cardCount) % cardCount)
    }
  }

  function next() {
    setShowHint(false)
    setActiveIdx((i) => (i + 1) % cardCount)
  }

  const activeItem    = items[activeIdx]
  const activeType    = activeItem?.content_type
  const activeTypeIdx = activeType ? TYPE_ORDER.indexOf(activeType) : 0

  return (
    <section style={{
      maxWidth: '1240px',
      margin: '0 auto',
      padding: '40px 24px 60px',
    }}>
      <div className="lr-hero-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1.1fr 1.3fr 0.9fr',
        gap: '32px',
        alignItems: 'center',
        minHeight: '500px',
      }}>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
              fontSize: 'clamp(56px, 9vw, 128px)',
              fontWeight: 900,
              lineHeight: 0.88,
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              marginBottom: '28px',
            }}
          >
            {t('headlinePart1')}<br/>{t('headlinePart2')}<br/>
            <span style={{ color: 'var(--brand-gold)' }}>{t('headlineHighlight')}</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginBottom: '32px' }}
          >
            <Link
              href="/content"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 22px',
                background: 'var(--brand-gold)',
                color: 'var(--text-inverse)',
                borderRadius: '999px',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              {t('viewAllLatest')}
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--text-inverse)',
                color: 'var(--brand-gold)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
              }}>→</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            {t('eyebrow', { parent: BRAND.parent })}
          </motion.div>
        </div>

        <div style={{
          position: 'relative',
          height: '420px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {cardCount === 0 ? (
            <EmptyStack message={t('empty')} />
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {items.map((item, idx) => {
                  const offset = (idx - activeIdx + cardCount) % cardCount
                  if (offset > 3) return null

                  return (
                    <Card
                      key={item.id}
                      item={item}
                      offset={offset}
                      isActive={offset === 0}
                      onDragEnd={offset === 0 ? handleDragEnd : undefined}
                      onClick={offset === 0 ? next : undefined}
                      typeLabel={tTypes(item.content_type)}
                      locale={locale}
                    />
                  )
                })}
              </AnimatePresence>

              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    style={{
                      position: 'absolute',
                      bottom: '24px',
                      insetInlineEnd: '12px',
                      background: 'var(--brand-gold)',
                      color: 'var(--text-inverse)',
                      fontSize: '11px',
                      fontWeight: 500,
                      padding: '5px 14px',
                      borderRadius: '999px',
                      letterSpacing: '0.04em',
                      pointerEvents: 'none',
                      zIndex: 50,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                    }}
                  >
                    {t('drag')}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        <div className="lr-hero-cats" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '4px',
        }}>
          {TYPE_ORDER.map((type, idx) => {
            const isActive = idx === activeTypeIdx
            return (
              <CategoryRow
                key={type}
                label={tNav(typeNavKey(type))}
                isActive={isActive}
                onClick={() => {
                  const next = items.findIndex((i, j) => i.content_type === type && j !== activeIdx)
                  if (next !== -1) {
                    setShowHint(false)
                    setActiveIdx(next)
                  }
                }}
              />
            )
          })}
        </div>
      </div>

      <Marquee />

      <style>{`
        @media (max-width: 900px) {
          .lr-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            min-height: 0 !important;
          }
          .lr-hero-cats {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            gap: 8px 14px !important;
            font-size: 16px !important;
          }
        }
      `}</style>
    </section>
  )
}

function typeNavKey(type: HeroItem['content_type']): 'manuals' | 'prophecies' | 'articles' | 'blog' {
  switch (type) {
    case 'manual':   return 'manuals'
    case 'prophecy': return 'prophecies'
    case 'article':  return 'articles'
    default:         return 'blog'
  }
}

function Card({
  item, offset, isActive, onDragEnd, onClick, typeLabel, locale,
}: {
  item:       HeroItem
  offset:     number
  isActive:   boolean
  onDragEnd?: (e: unknown, info: PanInfo) => void
  onClick?:   () => void
  typeLabel:  string
  locale:     string
}) {
  const layoutOffsets = [
    { rotate: 0,    x: 0,    y: 0,   scale: 1 },
    { rotate: 4,    x: 14,   y: 6,   scale: 0.96 },
    { rotate: -5,   x: -14,  y: 12,  scale: 0.92 },
    { rotate: 3,    x: 28,   y: 18,  scale: 0.88 },
  ]
  const layout = layoutOffsets[offset]
  const typeColor = TYPE_COLORS[item.content_type]

  const tints = ['#D4C4F8', '#F8C4D4', '#C4D8F8', '#C4F8D8']
  const tint  = tints[offset]

  return (
    <motion.div
      drag={isActive ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.4}
      onDragEnd={onDragEnd}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{
        rotate:  layout.rotate,
        x:       layout.x,
        y:       layout.y,
        scale:   layout.scale,
        zIndex:  20 - offset,
        opacity: 1,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        type:     'spring',
        stiffness: 240,
        damping:   24,
        mass:      0.8,
      }}
      whileHover={isActive ? { scale: 1.02 } : undefined}
      whileTap={isActive   ? { scale: 0.98 } : undefined}
      style={{
        position: 'absolute',
        width: '300px',
        height: '380px',
        borderRadius: '20px',
        background: tint,
        cursor: isActive ? 'grab' : 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        boxShadow: isActive
          ? '0 18px 50px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)'
          : '0 6px 20px rgba(0,0,0,0.10)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: '14px',
        borderRadius: '14px',
        background: item.cover_image_url
          ? `url(${item.cover_image_url}) center/cover`
          : `linear-gradient(135deg, ${typeColor}66 0%, ${typeColor}22 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {!item.cover_image_url && (
          <span style={{ fontSize: '64px', opacity: 0.4 }}>
            {item.content_type === 'manual'    ? '📘'
             : item.content_type === 'prophecy' ? '🕊'
             : item.content_type === 'article'  ? '📄'
             : '✍'}
          </span>
        )}
      </div>

      <div style={{
        position: 'absolute',
        top: '24px',
        insetInlineStart: '24px',
        insetInlineEnd: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 2,
      }}>
        <span style={{
          background: '#FFFFFF',
          color: '#212529',
          fontSize: '11px',
          fontWeight: 500,
          padding: '5px 11px',
          borderRadius: '999px',
        }}>
          {typeLabel}
        </span>
        {item.theme && (
          <span style={{
            background: 'rgba(255,255,255,0.8)',
            color: '#212529',
            fontSize: '10px',
            fontWeight: 500,
            padding: '4px 10px',
            borderRadius: '999px',
            backdropFilter: 'blur(6px)',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            maxWidth: '120px',
          }}>
            {item.theme}
          </span>
        )}
      </div>

      <div style={{
        position: 'absolute',
        bottom: '14px',
        insetInlineStart: '14px',
        insetInlineEnd: '14px',
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 2,
      }}>
        <div style={{ fontSize: '10px', color: '#5a5a5a', letterSpacing: '0.04em' }}>
          {item.speaker ? `${item.speaker} · ` : ''}
          {timeAgo(item.created_at, locale)}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: '15px',
          fontWeight: 500,
          color: '#212529',
          lineHeight: 1.25,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.title}
        </div>
        <Link
          href={{ pathname: '/content/[id]', params: { id: item.id } }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            insetInlineEnd: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#212529',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            fontSize: '14px',
          }}
        >
          →
        </Link>
      </div>
    </motion.div>
  )
}

function EmptyStack({ message }: { message: string }) {
  return (
    <div style={{
      width: '300px',
      height: '380px',
      borderRadius: '20px',
      background: 'var(--bg-raised)',
      border: '0.5px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '40px', opacity: 0.3, marginBottom: '14px' }}>📚</div>
      <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '12px', lineHeight: 1.5 }}>
        {message}
      </p>
    </div>
  )
}

function CategoryRow({
  label, isActive, onClick,
}: {
  label:    string
  isActive: boolean
  onClick:  () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 8px',
        fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
        fontSize: 'clamp(28px, 4vw, 48px)',
        fontWeight: 900,
        textTransform: 'uppercase',
        lineHeight: 1,
        letterSpacing: '-0.01em',
        color: isActive ? 'var(--text-primary)' : 'var(--text-faint)',
        transition: 'color 0.3s',
      }}
    >
      {isActive && (
        <motion.span
          layoutId="cat-highlight"
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          style={{
            position: 'absolute',
            inset: '8px -4px 6px -4px',
            background: 'rgba(245, 174, 65, 0.35)',
            borderRadius: '4px',
            zIndex: -1,
          }}
        />
      )}
      {label}
    </button>
  )
}

function Marquee() {
  const items = [
    'Lively Resources',
    'Manuals',
    'Prophecies',
    'Articles',
    'Blog',
    'LoveSeal Church',
    'Word made simple',
  ]
  const doubled = [...items, ...items]

  return (
    <div style={{
      marginTop: '40px',
      background: 'var(--brand-gold)',
      padding: '14px 0',
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div className="lr-marquee-track" style={{
        display: 'flex',
        gap: '40px',
        whiteSpace: 'nowrap',
        animation: 'lr-marquee 32s linear infinite',
        fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
        fontWeight: 700,
        fontSize: '18px',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--text-inverse)',
        width: 'max-content',
      }}>
        {doubled.map((item, idx) => (
          <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '40px' }}>
            {item}
            <span style={{
              width: '6px',
              height: '6px',
              background: 'var(--text-inverse)',
              borderRadius: '50%',
              flexShrink: 0,
            }} />
          </span>
        ))}
      </div>

      <style>{`
        @keyframes lr-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .lr-marquee-track:hover { animation-play-state: paused; }
      `}</style>
    </div>
  )
}

function timeAgo(dateString: string, locale: string): string {
  const d = new Date(dateString)
  const diff = (Date.now() - d.getTime()) / 60000
  if (diff < 60)     return `${Math.max(1, Math.floor(diff))} min`
  if (diff < 1440)   return `${Math.floor(diff / 60)} hr`
  if (diff < 10080)  return `${Math.floor(diff / 1440)} d`
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: '2-digit' })
}
