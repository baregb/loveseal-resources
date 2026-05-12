import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import ContentCard from '@/components/public/ContentCard'
import LandingHero from '@/components/landing/LandingHero'
import AboutStrip from '@/components/landing/AboutStrip'
import FeaturedSection from '@/components/landing/FeaturedSection'
import RevealOnScroll from '@/components/landing/RevealOnScroll'

export const revalidate = 60

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const tSections   = await getTranslations('sections')
  const tClosingCta = await getTranslations('closingCta')

  const supabase = await createClient()

  const { data: heroData } = await supabase
    .from('content')
    .select('id, title, content_type, theme, speaker, cover_image_url, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(8)

  const heroItems = (heroData ?? []) as Parameters<typeof LandingHero>[0]['items']

  const { data: featuredData } = await supabase
    .from('content')
    .select('id, title, content_type, theme, speaker, date_preached, cover_image_url, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(5)

  const featuredItems = (featuredData ?? []) as Parameters<typeof FeaturedSection>[0]['items']

  const types = ['manual', 'prophecy', 'article', 'blog'] as const
  const fetches = await Promise.all(
    types.map(t =>
      supabase
        .from('content')
        .select('id, title, content_type, theme, speaker, series, date_preached, cover_image_url, created_at, summary_points')
        .eq('status', 'published')
        .eq('content_type', t)
        .order('created_at', { ascending: false })
        .limit(4)
    )
  )

  const sections = types.map((type, idx) => ({
    type,
    items: ((fetches[idx].data ?? []) as Parameters<typeof ContentCard>[0]['item'][]),
  }))

  const sectionTitleKey = (type: string): 'manuals' | 'prophecies' | 'articles' | 'blog' => {
    switch (type) {
      case 'manual':   return 'manuals'
      case 'prophecy': return 'prophecies'
      case 'article':  return 'articles'
      default:         return 'blog'
    }
  }

  return (
    <div>
      <LandingHero items={heroItems} />

      <FeaturedSection items={featuredItems} />

      <AboutStrip />

      {sections.map((section) => {
        if (section.items.length === 0) return null
        return (
          <section key={section.type} style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '32px 24px',
          }}>
            <RevealOnScroll>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '20px',
                borderBottom: '0.5px solid var(--border-subtle)',
                paddingBottom: '14px',
              }}>
                <h2 style={{
                  fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
                  fontSize: 'clamp(20px, 3vw, 28px)',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}>
                  {tSections(sectionTitleKey(section.type))}
                </h2>
                <Link href={{ pathname: '/content', query: { type: section.type } }} style={{
                  fontSize: '12px',
                  color: 'var(--brand-gold)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}>
                  {tSections('viewAll')} →
                </Link>
              </div>
            </RevealOnScroll>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '14px',
            }}>
              {section.items.map((item, idx) => (
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
      })}

      {/* Closing CTA */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px 100px' }}>
        <RevealOnScroll>
          <div style={{
            background: 'var(--text-primary)',
            color: 'var(--bg-base)',
            borderRadius: '20px',
            padding: 'clamp(40px, 6vw, 80px)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              lineHeight: 1.0,
              letterSpacing: '-0.02em',
              marginBottom: '20px',
            }}>
              {tClosingCta('title1')}<br/>
              <span style={{ color: 'var(--brand-gold)' }}>{tClosingCta('title2')}</span><br/>
              {tClosingCta('title3')}
            </h2>
            <p style={{
              fontSize: '15px',
              opacity: 0.7,
              maxWidth: '480px',
              margin: '0 auto 32px',
              lineHeight: 1.6,
            }}>
              {tClosingCta('body')}
            </p>
            <Link href="/content" style={{
              display: 'inline-block',
              padding: '14px 28px',
              background: 'var(--brand-gold)',
              color: 'var(--text-primary)',
              borderRadius: '999px',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
            }}>
              {tClosingCta('button')}
            </Link>
          </div>
        </RevealOnScroll>
      </section>
    </div>
  )
}
