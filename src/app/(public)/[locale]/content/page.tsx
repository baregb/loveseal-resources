import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { metadataAlternates } from '@/lib/locale-urls'
import PublicContentList from './PublicContentList'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'library' })
  return {
    title:      t('title'),
    alternates: metadataAlternates(locale, '/content'),
  }
}

export default async function PublicContentPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'library' })

  const supabase = await createClient()
  const { data } = await supabase
    .from('content')
    .select(`
      id, title, content_type, language, category, tags,
      theme, lesson_number, speaker, series, date_preached, scripture_refs,
      cover_image_url, summary_points, created_at
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const items = (data ?? []) as Parameters<typeof PublicContentList>[0]['items']

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 24px 64px',
    }}>
      <div style={{ marginBottom: '28px' }}>
        <p style={{
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--brand-gold)',
          marginBottom: '10px',
        }}>
          {t('eyebrow')}
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 0.96,
          letterSpacing: '-0.02em',
          marginBottom: '8px',
        }}>
          {t('title')}
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-tertiary)',
        }}>
          {t('itemsCount', { count: items.length })}
        </p>
      </div>

      <PublicContentList items={items} />
    </div>
  )
}