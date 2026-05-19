import { Link } from '@/i18n/navigation'
import { tagSlug } from '@/lib/topic'
import { getTranslations } from 'next-intl/server'
import ContentCard from '@/components/public/ContentCard'
import RevealOnScroll from '@/components/landing/RevealOnScroll'
import { getTopTagsForType } from '@/lib/content-tags'

type ContentType = 'manual' | 'prophecy' | 'article' | 'blog'

type CardItem = Parameters<typeof ContentCard>[0]['item']

/**
 * "Latest X" section block.
 *
 * Renders one of: Latest Manuals · Latest Prophecies · Latest Articles ·
 * Latest Blog. Restyled per Pass 3 design template:
 *
 *   • red 8px square bullet
 *   • big Barlow Condensed section heading (uppercase, clamp-sized)
 *   • hashtag pill row (top tags within this content type)
 *   • "View all" link on the right
 *   • content cards grid below
 *
 * Was previously inlined inside `page.tsx`. Extracting it makes the home page
 * easier to read and the per-section heading lets us load tags server-side
 * without a client/server split inside page.tsx itself.
 */
export default async function LatestSection({
  type,
  items,
}: {
  type:  ContentType
  items: CardItem[]
}) {
  const tSections = await getTranslations('sections')
  const titleKey  = sectionTitleKey(type)
  const tags      = await getTopTagsForType(type, 60, 5)

  if (items.length === 0) return null

  return (
    <section
      style={{
        maxWidth: '90rem',
        margin:   '0 auto',
        padding:  '3.5rem 1.5rem 1rem',
      }}
    >
      <RevealOnScroll>
        <div
          style={{
            display:        'flex',
            alignItems:     'flex-end',
            justifyContent: 'space-between',
            gap:            '1.5rem',
            paddingBottom:  '1rem',
            borderBottom:   '0.0625rem solid var(--border-subtle)',
            marginBottom:   '1.5rem',
          }}
        >
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            {/* Heading: red square bullet + Barlow Condensed display */}
            <div
              style={{
                display:    'flex',
                alignItems: 'baseline',
                gap:        '0.75rem',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width:      '0.5rem',
                  height:     '0.5rem',
                  background: 'var(--brand-red)',
                  flexShrink: 0,
                  transform:  'translateY(-0.125rem)',
                }}
              />
              <h2
                style={{
                  margin:        0,
                  fontFamily:    'var(--font-display), "Barlow Condensed", system-ui, sans-serif',
                  fontSize:      'clamp(1.75rem, 4vw, 3.5rem)',
                  fontWeight:    800,
                  lineHeight:    1,
                  letterSpacing: '-0.012em',
                  textTransform: 'uppercase',
                  color:         'var(--text-primary)',
                }}
              >
                {tSections('latest', { type: tSections(titleKey) })}
              </h2>
            </div>

            {/* Hashtag pill row — only if we actually have tags */}
            {tags.length > 0 && (
              <div
                style={{
                  display:    'flex',
                  flexWrap:   'wrap',
                  gap:        '0.5rem',
                  marginTop:  '1rem',
                }}
              >
                {tags.map(({ tag }) => (
                  <Link
                    key={tag}
                    href={{ pathname: '/topics/[slug]', params: { slug: tagSlug(tag) } }}
                    style={{
                      display:        'inline-flex',
                      alignItems:     'center',
                      height:         '2rem',
                      padding:        '0 0.875rem',
                      fontSize:       '0.8125rem',
                      fontWeight:     500,
                      lineHeight:     1,
                      color:          'var(--text-primary)',
                      background:     'var(--bg-elevated)',
                      borderRadius:   '999rem',
                      textDecoration: 'none',
                      whiteSpace:     'nowrap',
                      transition:     'background-color 0.12s',
                    }}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href={{ pathname: '/content', query: { type } }}
            style={{
              fontSize:       '0.8125rem',
              color:          'var(--brand-red)',
              textDecoration: 'none',
              fontWeight:     500,
              whiteSpace:     'nowrap',
              alignSelf:      'flex-end',
            }}
          >
            {tSections('viewAll')} →
          </Link>
        </div>
      </RevealOnScroll>

      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(16.25rem, 1fr))',
          gap:                 '0.875rem',
        }}
      >
        {items.map((item, idx) => (
          <RevealOnScroll
            key={item.id}
            delay={Math.min(idx * 0.06, 0.24)}
            yOffset={20}
          >
            <ContentCard item={item} layout="grid" />
          </RevealOnScroll>
        ))}
      </div>
    </section>
  )
}

function sectionTitleKey(type: ContentType): 'manuals' | 'prophecies' | 'articles' | 'blog' {
  switch (type) {
    case 'manual':   return 'manuals'
    case 'prophecy': return 'prophecies'
    case 'article':  return 'articles'
    default:         return 'blog'
  }
}