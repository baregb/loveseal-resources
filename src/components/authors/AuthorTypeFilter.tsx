'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

/**
 * Segmented type filter on `/authors/[slug]`.
 *
 *   [ All (23) ] [ Manuals (14) ] [ Prophecies (5) ] [ Articles (4) ]
 *
 * Only renders segments that have content. Selection is reflected in the
 * `?type=` query param so it's shareable and the back button works.
 *
 * Suspense-wrapped because next/navigation's `useSearchParams` makes the
 * component bail out of static rendering — matches the pattern used in
 * ContentReader for its own searchParams-dependent toggle.
 */

interface AuthorTypeFilterProps {
  /** Per-type counts. Segments are only rendered for non-zero types. */
  counts: {
    manual:   number
    prophecy: number
    article:  number
    blog:     number
    sermon:   number
    total:    number
  }
}

export default function AuthorTypeFilter({ counts }: AuthorTypeFilterProps) {
  return (
    <Suspense fallback={<div style={{ height: '2.75rem' }} />}>
      <Inner counts={counts} />
    </Suspense>
  )
}

function Inner({ counts }: AuthorTypeFilterProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const tNav         = useTranslations('nav')
  const tFilters     = useTranslations('filters')

  const current = searchParams.get('type') ?? 'all'

  /* Build segment list. Each entry knows its own value + label + count.
     We render in a fixed order regardless of count desc, so the segment
     positions are stable as new content is published. */
  const segments = [
    { value: 'all',      label: tNav('all'),         count: counts.total    },
    { value: 'manual',   label: tNav('manuals'),     count: counts.manual   },
    { value: 'prophecy', label: tNav('prophecies'),  count: counts.prophecy },
    { value: 'article',  label: tNav('articles'),    count: counts.article  },
    { value: 'blog',     label: tNav('blog'),        count: counts.blog     },
    { value: 'sermon',   label: tNav('sermons'),     count: counts.sermon   },
  ].filter(s => s.value === 'all' || s.count > 0)

  function select(value: string) {
    const next = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      next.delete('type')
    } else {
      next.set('type', value)
    }
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  // Don't render the row if there's only an "All" segment — it would just
  // be a static "All (0)" button, which is more clutter than signal.
  if (segments.length <= 1) return null

  return (
    <div
      role="tablist"
      aria-label={tFilters('type')}
      style={{
        display:       'flex',
        flexWrap:      'wrap',
        gap:           '0.375rem',
        marginBottom:  '1.75rem',
      }}
    >
      {segments.map(seg => {
        const active = seg.value === current
        return (
          <button
            key={seg.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => select(seg.value)}
            style={{
              padding:        '0.5rem 0.875rem',
              borderRadius:   '999rem',
              fontFamily:     'var(--font-body)',
              fontSize:       '0.8125rem',
              fontWeight:     active ? 600 : 500,
              color:          active ? 'var(--text-inverse)' : 'var(--text-secondary)',
              background:     active ? 'var(--brand-gold)' : 'var(--bg-raised)',
              border:         active ? '0.0625rem solid var(--brand-gold)' : '0.0625rem solid var(--border-subtle)',
              cursor:         'pointer',
              transition:     'background 0.12s, border-color 0.12s, color 0.12s',
              whiteSpace:     'nowrap',
            }}
          >
            <span>{seg.label}</span>
            <span style={{
              marginLeft: '0.375rem',
              fontSize:   '0.6875rem',
              opacity:    0.7,
            }}>
              {seg.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}