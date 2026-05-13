'use client'

import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'

interface ContentItemForCard {
  id:              string
  title:           string
  content_type:    'manual' | 'prophecy' | 'article' | 'blog'
  theme:           string | null
  speaker:         string | null
  series?:         string | null
  date_preached:   string | null
  cover_image_url: string | null
  created_at:      string
  summary_points:  string[] | null
}

const TYPE_COLORS: Record<string, string> = {
  manual:   '#4498CC',
  prophecy: '#C32126',
  article:  '#F5AE41',
  blog:     '#3C3C3C',
}

export default function ContentCard({
  item,
  layout = 'grid',
}: {
  item: ContentItemForCard
  layout?: 'grid' | 'list'
}) {
  const tTypes  = useTranslations('content.types')
  const locale  = useLocale()
  const typeColor = TYPE_COLORS[item.content_type]

  const dateString = item.date_preached
    ? new Date(item.date_preached).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date(item.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  if (layout === 'list') {
    return (
      <Link
        href={{ pathname: '/content/[id]', params: { id: item.id } }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: '16px',
          alignItems: 'center',
          padding: '14px 16px',
          background: 'var(--bg-raised)',
          border: '0.5px solid var(--border-subtle)',
          borderRadius: '10px',
          textDecoration: 'none',
          transition: 'border-color 0.12s, transform 0.12s',
        }}
      >
        <div style={{
          /* `position: relative` is required by <Image fill>. The width/height
             stays explicit so the image's intrinsic ratio doesn't drive layout. */
          position: 'relative',
          width: '64px',
          height: '64px',
          borderRadius: '8px',
          overflow: 'hidden',
          flexShrink: 0,
          background: item.cover_image_url
            ? undefined
            : `linear-gradient(135deg, ${typeColor}22 0%, ${typeColor}08 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {item.cover_image_url ? (
            /* sizes hint matches the rendered width; Next picks the closest
               srcset entry. List cover is a fixed 64px so the hint is exact. */
            <Image
              src={item.cover_image_url}
              alt=""
              fill
              sizes="64px"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '24px', opacity: 0.4 }}>{typeIcon(item.content_type)}</span>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <TypePill type={item.content_type} label={tTypes(item.content_type)} />
            {item.theme && (
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                {item.theme}
              </span>
            )}
          </div>
          <h3 style={{
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            marginBottom: '3px',
            lineHeight: 1.3,
            textTransform: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {item.title}
          </h3>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {item.speaker && <span>{item.speaker} · </span>}
            <span>{dateString}</span>
          </div>
        </div>

        <div style={{ color: 'var(--text-faint)', flexShrink: 0 }}>
          →
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={{ pathname: '/content/[id]', params: { id: item.id } }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-raised)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: '12px',
        overflow: 'hidden',
        textDecoration: 'none',
        transition: 'border-color 0.12s, transform 0.12s',
        height: '100%',
      }}
    >
      <div style={{
        aspectRatio: '4 / 3',
        background: item.cover_image_url
          ? undefined
          : `linear-gradient(135deg, ${typeColor}33 0%, ${typeColor}0a 100%)`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {item.cover_image_url ? (
          /* Grid cover is responsive (minmax(240px, 1fr) in PublicContentList).
             At max screen width with 4-up layout that's ~280-300px wide; on
             mobile it's ~340px. The sizes hint covers both viewports. */
          <Image
            src={item.cover_image_url}
            alt=""
            fill
            sizes="(max-width: 820px) 100vw, (max-width: 1200px) 33vw, 25vw"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '48px', opacity: 0.35 }}>{typeIcon(item.content_type)}</span>
        )}
        <div style={{ position: 'absolute', top: '10px', insetInlineStart: '10px', zIndex: 1 }}>
          <TypePill type={item.content_type} label={tTypes(item.content_type)} />
        </div>
      </div>

      <div style={{
        padding: '14px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
        {item.theme && (
          <div style={{
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '8px',
          }}>
            {item.theme}
          </div>
        )}
        <h3 style={{
          fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
          fontSize: '18px',
          fontWeight: 700,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          marginBottom: '8px',
          lineHeight: 1.15,
          letterSpacing: '-0.005em',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.title}
        </h3>
        <div style={{ flex: 1 }} />
        <div style={{
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          marginTop: '10px',
        }}>
          {item.speaker && (
            <>
              <span>{item.speaker}</span>
              <span style={{ color: 'var(--text-faint)' }}>·</span>
            </>
          )}
          <span>{dateString}</span>
        </div>
      </div>
    </Link>
  )
}

function TypePill({ type, label }: { type: string; label: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 9px',
      background: TYPE_COLORS[type],
      color: '#FFFFFF',
      fontSize: '10px',
      fontWeight: 500,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      borderRadius: '20px',
    }}>
      {label}
    </span>
  )
}

function typeIcon(type: string): string {
  switch (type) {
    case 'manual':   return '📘'
    case 'prophecy': return '🕊'
    case 'article':  return '📄'
    case 'blog':     return '✍'
    default:         return '📄'
  }
}