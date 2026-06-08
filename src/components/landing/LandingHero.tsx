'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { Link, useRouter } from '@/i18n/navigation'

interface HeroItem {
  id:              string
  title:           string
  content_type:    'manual' | 'prophecy' | 'article' | 'blog'
  theme:           string | null
  series:          string | null
  speaker:         string | null
  cover_image_url: string | null
  created_at:      string
}

const TYPE_ORDER: HeroItem['content_type'][] = ['manual', 'prophecy', 'article', 'blog']

/* Each content type gets its own brand-derived pastel background. */
const TYPE_BG: Record<HeroItem['content_type'], string> = {
  manual:   '#FDDEDE',   // soft red
  prophecy: '#B7DCF1',   // sky blue (design exact)
  article:  '#FEF3C7',   // warm gold
  blog:     '#C8BFEC',   // lilac (design exact)
}

export default function LandingHero({ items }: { items: HeroItem[] }) {
  const t       = useTranslations('hero')
  const tNav    = useTranslations('nav')
  const tTypes  = useTranslations('content.types')
  const locale  = useLocale()

  const [activeIdx, setActiveIdx] = useState(0)
  const [showHint, setShowHint]   = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const cardCount = items.length

  useEffect(() => {
    if (activeIdx > 0) setShowHint(false)
  }, [activeIdx])

  // Always auto-advance; pause on hover
  useEffect(() => {
    if (isHovered || cardCount <= 1) return
    const timer = setTimeout(() => setActiveIdx((i) => (i + 1) % cardCount), 4000)
    return () => clearTimeout(timer)
  }, [activeIdx, isHovered, cardCount])

  function handleDragEnd(_: unknown, info: PanInfo) {
    const swipe = info.offset.x
    if (Math.abs(swipe) < 60) return
    if (swipe < 0) {
      setActiveIdx((i) => (i + 1) % cardCount)
    } else {
      setActiveIdx((i) => (i - 1 + cardCount) % cardCount)
    }
  }

  const activeItem    = items[activeIdx]
  const activeType    = activeItem?.content_type
  /* Active row in the right column is driven by the active card's
     content_type — TYPE_ORDER index resolution. Matches the locked
     answer: "Drive from active card, keep current top-down order". */
  const activeTypeIdx = activeType ? TYPE_ORDER.indexOf(activeType) : 0

  return (
    <section
      style={{
        padding: '2.5rem var(--page-inline-padding) 3.75rem',
      }}
    >
      <div
        className="lr-hero-grid"
        style={{
          display:             'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap:                 '2rem',
          alignItems:          'center',
          minHeight:           '28rem',
        }}
      >
        {/* ── LEFT: headline + view-all CTA ──────────────────────────── */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily:    'var(--font-display), "Barlow Condensed", sans-serif',
              fontSize:      'clamp(2.75rem, 7vw, 6.5rem)',
              fontWeight:    900,
              lineHeight:    0.92,
              color:         'var(--text-primary)',
              letterSpacing: '-0.018em',
              marginBottom:  '1rem',
              textTransform: 'uppercase',
            }}
          >
            {t('peace.line1')}
            <br />
            <span style={{ color: 'var(--brand-red)' }}>{t('peace.line2')}</span>
          </motion.h1>

          <motion.p
            className="lr-hero-subline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily:   'var(--font-body), system-ui, sans-serif',
              fontSize:     'clamp(0.9375rem, 1.4vw, 1.125rem)',
              lineHeight:   1.5,
              color:        'var(--text-secondary)',
              maxWidth:     '32rem',
              marginBottom: '1.75rem',
            }}
          >
            {t('peace.subline')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginBottom: '0.5rem' }}
          >
            <Link
              href="/content"
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                gap:            '0.625rem',
                padding:        '0.875rem 1.375rem',
                background:     'var(--brand-red)',
                color:          '#FFFFFF',
                borderRadius:   '999rem',
                fontSize:       '0.875rem',
                fontWeight:     500,
                textDecoration: 'none',
              }}
            >
              {t('viewAllLatest')}
              <span
                style={{
                  width:          '1.5rem',
                  height:         '1.5rem',
                  borderRadius:   '50%',
                  background:     '#14110D',
                  color:          '#FFFFFF',
                  display:        'inline-flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       '0.8125rem',
                }}
              >→</span>
            </Link>
          </motion.div>
        </div>

        {/* ── CENTER: fanned card stack ─────────────────────────────── */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            position:       'relative',
            height:         '28rem',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}
        >
          {cardCount === 0 ? (
            <EmptyStack message={t('empty')} />
          ) : (
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
                    typeLabel={tTypes(item.content_type)}
                    locale={locale}
                    showHint={offset === 0 && showHint}
                    hintLabel={t('drag')}
                  />
                )
              })}
            </AnimatePresence>
          )}
        </div>

        {/* ── RIGHT: type column, active = brand-red + underline ─────── */}
        <div
          className="lr-hero-cats"
          style={{
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'flex-end',
            gap:           '0.125rem',
          }}
        >
          {TYPE_ORDER.map((type, idx) => {
            const isActive = idx === activeTypeIdx
            return (
              <CategoryRow
                key={type}
                label={tNav(typeNavKey(type))}
                isActive={isActive}
                onClick={() => {
                  const nextIdx = items.findIndex((i, j) => i.content_type === type && j !== activeIdx)
                  if (nextIdx !== -1) {
                    setShowHint(false)
                    setActiveIdx(nextIdx)
                  }
                }}
              />
            )
          })}
        </div>
      </div>

      <style>{`
        @media (min-width: 56.25rem) {
          .lr-hero-subline { display: none !important; }
        }
        @media (max-width: 56.25rem) {
          .lr-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
            min-height: 0 !important;
          }
          .lr-hero-cats {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            align-items: center !important;
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

/* ─────────────────────────────────────────────────────────────────────────────
   Card — single fan card. Layout per design:
     · Background tint shows on offset 1+ (the cards peeking behind active)
     · Active card: cover image fills the entire body. White meta bar pinned
       to the bottom with eyebrow (timeAgo · content_type) + title + arrow.
     · Drag hint pill anchored to the active card's bottom-right CORNER,
       overlapping the card edge — not floating in the container.
   ───────────────────────────────────────────────────────────────────────── */
function Card({
  item, offset, isActive, onDragEnd, typeLabel, locale,
  showHint, hintLabel,
}: {
  item:       HeroItem
  offset:     number
  isActive:   boolean
  onDragEnd?: (e: unknown, info: PanInfo) => void
  typeLabel:  string
  locale:     string
  showHint:   boolean
  hintLabel:  string
}) {
  const router     = useRouter()
  const didDrag    = useRef(false)

  const layoutOffsets = [
    { rotate:  0,   x:   0, y:   0, scale: 1    },
    { rotate:  6,   x:  22, y:  10, scale: 0.95 },
    { rotate: -7,   x: -22, y:  18, scale: 0.91 },
    { rotate:  4,   x:  34, y:  26, scale: 0.87 },
  ]
  const layout = layoutOffsets[offset]
  const bg     = TYPE_BG[item.content_type]

  function handleDragStart() {
    didDrag.current = false
  }
  function handleDrag() {
    didDrag.current = true
  }
  function handleDragEnd(e: unknown, info: PanInfo) {
    onDragEnd?.(e, info)
    // Reset AFTER the click event fires so click guard works
    setTimeout(() => { didDrag.current = false }, 50)
  }
  function handleClick() {
    if (didDrag.current) return
    router.push({ pathname: '/content/[id]', params: { id: item.id } })
  }

  return (
    <motion.div
      drag={isActive ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.4}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
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
      transition={{ type: 'spring', stiffness: 240, damping: 24, mass: 0.8 }}
      whileHover={{ scale: isActive ? 1.02 : 1.01 }}
      whileTap={{ scale: 0.98 }}
      style={{
        position:         'absolute',
        width:            '17.5rem',
        height:           '25rem',
        borderRadius:     '1.375rem',
        background:       bg,
        cursor:           isActive ? 'grab' : 'pointer',
        userSelect:       'none',
        WebkitUserSelect: 'none',
        boxShadow:        isActive
          ? '0 1.125rem 3.125rem rgba(0,0,0,0.18), 0 0.25rem 0.75rem rgba(0,0,0,0.08)'
          : '0 0.375rem 1.25rem rgba(0,0,0,0.10)',
        overflow:         'visible',
      }}
    >
      {/* Cover image fills card when available */}
      {item.cover_image_url && (
        <div
          style={{
            position:     'absolute',
            inset:        0,
            borderRadius: '1.375rem',
            overflow:     'hidden',
          }}
        >
          <Image
            src={item.cover_image_url}
            alt=""
            fill
            sizes="17.5rem"
            priority={isActive}
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Bottom meta bar — white overlay on image, or colored bg card. */}
      <div
        style={{
          position:         'absolute',
          bottom:           '0.875rem',
          insetInlineStart: '0.875rem',
          insetInlineEnd:   '0.875rem',
          background:       '#FFFFFF',
          borderRadius:     '0.75rem',
          padding:          '0.875rem 1rem',
          display:          'flex',
          flexDirection:    'column',
          gap:              '0.375rem',
          zIndex:           2,
          boxShadow:        '0 8px 20px -8px rgba(20,17,13,0.2)',
        }}
      >
        <div
          style={{
            fontSize:      '0.625rem',
            fontWeight:    600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color:         '#5a5a5a',
          }}
        >
          {timeAgo(item.created_at, locale)} · {typeLabel}
        </div>

        <div
          style={{
            fontFamily:       'var(--font-body)',
            fontSize:         '0.9375rem',
            fontWeight:       'var(--content-title-weight, 800)',
            textTransform:    'var(--content-title-transform, uppercase)',
            color:            '#212529',
            lineHeight:       1.25,
            display:          '-webkit-box',
            WebkitLineClamp:  2,
            WebkitBoxOrient:  'vertical',
            overflow:         'hidden',
            paddingInlineEnd: '2.25rem',
          }}
        >
          {item.title}
        </div>

        <span
          aria-hidden="true"
          style={{
            position:        'absolute',
            insetInlineEnd:  '0.875rem',
            top:             '50%',
            transform:       'translateY(-50%)',
            width:           '2rem',
            height:          '2rem',
            borderRadius:    '50%',
            background:      '#14110D',
            color:           '#FFFFFF',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            fontSize:        '0.875rem',
            pointerEvents:   'none',
          }}
        >
          →
        </span>
      </div>

      {/* Series pill — top-left, only shown when series is set.
          The content type is already communicated by the card bg + bottom eyebrow. */}
      {item.series && (
        <div
          style={{
            position:         'absolute',
            top:              '0.875rem',
            insetInlineStart: '0.875rem',
            background:       '#FFFFFF',
            borderRadius:     '999rem',
            padding:          '0.25rem 0.625rem',
            fontSize:         '0.625rem',
            fontWeight:       700,
            letterSpacing:    '0.1em',
            textTransform:    'uppercase',
            color:            '#14110D',
            zIndex:           3,
            maxWidth:         'calc(100% - 1.75rem)',
            overflow:         'hidden',
            textOverflow:     'ellipsis',
            whiteSpace:       'nowrap',
          }}
        >
          {item.series}
        </div>
      )}

      {/* Drag hint pill — gold, bottom-right corner overlap */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            style={{
              position:       'absolute',
              bottom:         '-0.5rem',
              insetInlineEnd: '-0.5rem',
              background:     'var(--brand-gold)',
              color:          '#14110D',
              fontSize:       '0.6875rem',
              fontWeight:     600,
              padding:        '0.3125rem 0.875rem',
              borderRadius:   '999rem',
              letterSpacing:  '0.04em',
              pointerEvents:  'none',
              zIndex:         50,
              boxShadow:      '0 0.25rem 0.875rem rgba(0,0,0,0.15)',
            }}
          >
            {hintLabel}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function EmptyStack({ message }: { message: string }) {
  return (
    <div
      style={{
        width:          '17.5rem',
        height:         '25rem',
        borderRadius:   '1.375rem',
        background:     'var(--bg-raised)',
        border:         '0.03125rem solid var(--border-subtle)',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '2rem',
        textAlign:      'center',
      }}
    >
      <div style={{ fontSize: '2.5rem', opacity: 0.3, marginBottom: '0.875rem' }}>📚</div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
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
        position:      'relative',
        background:    'transparent',
        border:        'none',
        cursor:        'pointer',
        padding:       '0',
        fontFamily:    'var(--font-display), "Barlow Condensed", sans-serif',
        fontSize:      'clamp(2.5rem, 4.5vw, 4.25rem)',
        fontWeight:    900,
        textTransform: 'uppercase',
        lineHeight:    0.98,
        letterSpacing: '-0.012em',
        color:         'color-mix(in srgb, var(--text-primary) 32%, transparent)',
        textAlign:     'right',
        textDecoration: 'none',
      }}
    >
      {isActive ? (
        <span style={{ position: 'relative', display: 'inline-block' }}>
          {/* Red echo — offset behind the main text */}
          <span
            aria-hidden="true"
            style={{
              position:  'absolute',
              inset:     0,
              color:     'var(--brand-red)',
              transform: 'translate(8px, 6px)',
              zIndex:    0,
              opacity:   0.9,
            }}
          >
            {label}
          </span>
          {/* Main text — full-opacity dark on top */}
          <span style={{ position: 'relative', color: 'var(--text-primary)', zIndex: 1 }}>
            {label}
          </span>
        </span>
      ) : label}
    </button>
  )
}

function timeAgo(dateString: string, locale: string): string {
  const d = new Date(dateString)
  const diff = (Date.now() - d.getTime()) / 60000
  if (diff < 60)     return `${Math.max(1, Math.floor(diff))} min ago`
  if (diff < 1440)   return `${Math.floor(diff / 60)} hr ago`
  if (diff < 10080)  return `${Math.floor(diff / 1440)} d ago`
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: '2-digit' })
}