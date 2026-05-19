import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { tagSlug } from '@/lib/topic'
import { getTopRecentSearchTerms } from '@/lib/recent-searches'
import { SOCIAL_LINKS } from '@/lib/social-links'
import { SocialIcon } from '@/components/public/FooterSocialIcons'

/**
 * "In focus this week" hashtags + "JOIN US" social squares.
 *
 * Slots below the hero, above `FeaturedSection`. Server-rendered. If the
 * `recent_searches` aggregate returns nothing (truly cold start), the entire
 * strip is hidden — no point showing an empty hashtag row.
 *
 * The hashtag row is anchored from the LEFT, the JOIN US block from the
 * RIGHT, with a flexbox space-between so they collapse cleanly on narrow
 * viewports. Mobile drops the LEFT label and shows only the tags + socials.
 */
export default async function InFocusStrip() {
  const t = await getTranslations('sections')

  const topTerms = await getTopRecentSearchTerms(168, 5)

  /* Self-hide when there's truly nothing to surface. Don't ship empty
     chrome on a brand-new install. */
  if (topTerms.length === 0) return null

  return (
    <section
      aria-label={t('inFocus.label')}
      style={{
        /* Full viewport width; horizontal padding from the shared token
           so this section's left/right edges align with the header and
           hero. */
        padding: '0 var(--page-inline-padding)',
      }}
    >
      <div
        className="lr-infocus"
        style={{
          display:        'flex',
          alignItems:     'flex-end',
          justifyContent: 'space-between',
          flexWrap:       'wrap',
          gap:            '1.5rem',
          padding:        '1.5rem 0 0',
          marginTop:      '2rem',
        }}
      >
        {/* LEFT — eyebrow label + hashtag row */}
        <div style={{ minWidth: 0, flex: '1 1 auto' }}>
          <div
            style={{
              fontSize:  '0.75rem',
              color:     'var(--text-tertiary)',
              marginBottom: '0.5rem',
            }}
          >
            {t('inFocus.label')}
          </div>
          <div
            className="lr-infocus-tags"
            style={{
              display:    'flex',
              flexWrap:   'wrap',
              gap:        '0.75rem 1.25rem',
              fontFamily: 'var(--font-display, "Barlow Condensed"), system-ui, sans-serif',
              fontSize:   '1.125rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color:      'var(--text-primary)',
            }}
          >
            {topTerms.map(({ term }) => (
               <Link
                key={term}
                href={{ pathname: '/topics/[slug]', params: { slug: tagSlug(term) } }}
                style={{
                  color:          'inherit',
                  textDecoration: 'none',
                  transition:     'opacity 0.12s',
                }}
              >
                #{term}
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT — JOIN US label + 5 social squares */}
        <div
          className="lr-infocus-join"
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '0.875rem',
            flex:       '0 0 auto',
          }}
        >
          <span
            style={{
              fontSize:      '0.75rem',
              fontWeight:    700,
              letterSpacing: '0.2em',
              color:         'var(--text-tertiary)',
              whiteSpace:    'nowrap',
            }}
          >
            {t('joinUs')}
          </span>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  width:          '2.25rem',
                  height:         '2.25rem',
                  color:          '#FFFFFF',
                  background:     s.background,
                  backgroundImage: s.gradient,
                  textDecoration: 'none',
                  transition:     'transform 0.12s, opacity 0.12s',
                }}
              >
                <SocialIcon name={s.icon} size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 40rem) {
          .lr-infocus {
            flex-direction: column;
            align-items: stretch;
          }
          .lr-infocus-join {
            justify-content: space-between;
          }
        }
      `}</style>
    </section>
  )
}