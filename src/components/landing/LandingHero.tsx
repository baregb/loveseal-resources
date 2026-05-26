'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'

interface HeroItem {
  id:              string
  title:           string
  content_type:    'manual' | 'prophecy' | 'article' | 'blog'
  theme:           string | null
  speaker:         string | null
  cover_image_url: string | null
  created_at:      string
}

const TYPE_ORDER: HeroItem['content_type'][] = ['manual', 'prophecy', 'article', 'blog']

/* Pastel tints that appear BEHIND the active card as the stack fans out.
   Offset 0 = active card (no tint applied; cover takes over). Offsets 1+ are
   the cards peeking out behind. Pink / blue / mint / soft-yellow approximates
   the design template's fan. */
const STACK_TINTS = ['#FFFFFF', '#F5C9D6', '#B8E0E6', '#C5E8C8', '#F2D89C']

export default function LandingHero({ items }: { items: HeroItem[] }) {
  const t       = useTranslations('hero')
  const tNav    = useTranslations('nav')
  const tTypes  = useTranslations('content.types')
  const locale  = useLocale()

  const [activeIdx, setActiveIdx] = useState(0)
  const [showHint, setShowHint]   = useState(true)
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
          gridTemplateColumns: '1.1fr 1.3fr 0.9fr',
          gap:                 '2rem',
          alignItems:          'center',
          minHeight:           '31.25rem',
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
              fontSize:      'clamp(2.5rem, 7vw, 6rem)',
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
                  background:     '#FFFFFF',
                  color:          'var(--brand-red)',
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
          style={{
            position:       'relative',
            height:         '26.25rem',
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
                    onClick={offset === 0 ? next : undefined}
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
  item, offset, isActive, onDragEnd, onClick, typeLabel, locale,
  showHint, hintLabel,
}: {
  item:       HeroItem
  offset:     number
  isActive:   boolean
  onDragEnd?: (e: unknown, info: PanInfo) => void
  onClick?:   () => void
  typeLabel:  string
  locale:     string
  showHint:   boolean
  hintLabel:  string
}) {
  /* Stronger fan vs the previous values so the stack reads at-a-glance the
     way it does in the design — visible peek of each tint, distinct tilt. */
  const layoutOffsets = [
    { rotate:  0,   x:   0, y:   0, scale: 1    },
    { rotate:  6,   x:  22, y:  10, scale: 0.95 },
    { rotate: -7,   x: -22, y:  18, scale: 0.91 },
    { rotate:  4,   x:  34, y:  26, scale: 0.87 },
  ]
  const layout = layoutOffsets[offset]
  const tint   = STACK_TINTS[offset] ?? '#FFFFFF'

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
      transition={{ type: 'spring', stiffness: 240, damping: 24, mass: 0.8 }}
      whileHover={isActive ? { scale: 1.02 } : undefined}
      whileTap={isActive   ? { scale: 0.98 } : undefined}
      style={{
        position:         'absolute',
        width:            '18.75rem',
        height:           '23.75rem',
        borderRadius:     '1.25rem',
        background:       tint,
        cursor:           isActive ? 'grab' : 'pointer',
        userSelect:       'none',
        WebkitUserSelect: 'none',
        boxShadow:        isActive
          ? '0 1.125rem 3.125rem rgba(0,0,0,0.18), 0 0.25rem 0.75rem rgba(0,0,0,0.08)'
          : '0 0.375rem 1.25rem rgba(0,0,0,0.10)',
        overflow:         'visible',
      }}
    >
      {/* Cover image area — fills the entire card body. The white meta bar
          at the bottom overlays the image; no separate inset frame the way
          the previous version had. */}
      <div
        style={{
          position:        'absolute',
          inset:           0,
          borderRadius:    '1.25rem',
          overflow:        'hidden',
          background:      item.cover_image_url
            ? undefined
            /* Empty-state: diagonal stripe placeholder pattern that matches
               the design's "placeholder · cover photo (asset)" boxes. Drawn
               as a repeating linear-gradient on top of a warm cream so it
               reads identically across themes. */
            : `repeating-linear-gradient(
                135deg,
                #E8D9B8 0 1rem,
                #D4C19A 1rem 2rem
              )`,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
        }}
      >
        {item.cover_image_url ? (
          <Image
            src={item.cover_image_url}
            alt=""
            fill
            sizes="(max-width: 51.25rem) 17.5rem, 18.75rem"
            priority={isActive}
            style={{ objectFit: 'cover' }}
          />
        ) : null}
      </div>

      {/* Bottom meta bar — eyebrow (time · type) + title + arrow. Pinned
          to the card's bottom inset, white on cover, follows the design
          exactly. No top type pill — the type is mentioned in the eyebrow. */}
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
            fontFamily:      'var(--font-body)',
            fontSize:        '0.9375rem',
            fontWeight:      600,
            color:           '#212529',
            lineHeight:      1.25,
            display:         '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow:        'hidden',
            paddingInlineEnd: '2.25rem',
          }}
        >
          {item.title}
        </div>

        <Link
          href={{ pathname: '/content/[id]', params: { id: item.id } }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position:        'absolute',
            insetInlineEnd:  '0.875rem',
            top:             '50%',
            transform:       'translateY(-50%)',
            width:           '2rem',
            height:          '2rem',
            borderRadius:    '50%',
            background:      '#212529',
            color:           '#FFFFFF',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            textDecoration:  'none',
            fontSize:        '0.875rem',
          }}
        >
          →
        </Link>
      </div>

      {/* Drag hint — anchored to the ACTIVE CARD's bottom-right CORNER,
          overlapping the card edge, gold pill. Matches the design exactly.
          AnimatePresence is on the outside so the pill can fade out the
          moment the user starts swiping. */}
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
              color:          'var(--text-inverse)',
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
        width:          '18.75rem',
        height:         '23.75rem',
        borderRadius:   '1.25rem',
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
        position:       'relative',
        background:     'transparent',
        border:         'none',
        cursor:         'pointer',
        padding:        '0',
        fontFamily:     'var(--font-display), "Barlow Condensed", sans-serif',
        fontSize:       'clamp(2.5rem, 4.5vw, 4.25rem)',
        fontWeight:     900,
        textTransform:  'uppercase',
        lineHeight:     0.98,
        letterSpacing:  '-0.012em',
        color:          isActive
          ? 'var(--brand-red)'
          : 'color-mix(in srgb, var(--text-primary) 32%, transparent)',
        textAlign:       'right',
        textDecoration:  isActive ? 'underline' : 'none',
        textUnderlineOffset: isActive ? '0.25rem' : undefined,
        textDecorationThickness: isActive ? '0.125rem' : undefined,
        transition:      'color 0.3s',
      }}
    >
      {label}
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