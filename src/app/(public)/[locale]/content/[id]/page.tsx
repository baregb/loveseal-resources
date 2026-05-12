import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { metadataAlternates, localeUrl } from '@/lib/locale-urls'
import ContentReader from './ContentReader'
import { ArticleSchema } from '@/components/brand/Schema'
import { BRAND } from '@/components/brand/Brand'
import type { Locale } from '@/types'

export const revalidate = 60

interface PageParams {
  params: Promise<{ id: string; locale: string }>
}

interface ContentRowForMeta {
  language:        Locale
  title:           string
  theme:           string | null
  speaker:         string | null
  content_type:    'manual' | 'prophecy' | 'article' | 'blog'
  body_html:       string | null
  extracted_text:  string | null
  summary_points:  string[] | null
  cover_image_url: string | null
}

interface TranslationRow {
  title:          string
  theme:          string | null
  body_html:      string | null
  extracted_text: string | null
  summary_points: string[] | null
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { id, locale } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('content')
    .select('language, title, theme, speaker, content_type, body_html, extracted_text, summary_points, cover_image_url')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  const item = data as ContentRowForMeta | null
  if (!item) {
    const t = await getTranslations({ locale, namespace: 'notFound' })
    return { title: t('title') }
  }

  // If viewing in a non-source locale, pull the translation for metadata too
  let title          = item.title
  let theme          = item.theme
  let body           = item.body_html
  let extracted      = item.extracted_text
  let summaryPts     = item.summary_points

  if (locale !== item.language) {
    const { data: tr } = await supabase
      .from('content_translations')
      .select('title, theme, body_html, extracted_text, summary_points')
      .eq('content_id', id)
      .eq('locale', locale)
      .maybeSingle()

    const trTyped = tr as TranslationRow | null
    if (trTyped) {
      title      = trTyped.title
      theme      = trTyped.theme
      body       = trTyped.body_html
      extracted  = trTyped.extracted_text
      summaryPts = trTyped.summary_points
    }
  }

  let description = ''
  if (summaryPts && summaryPts.length > 0) {
    description = summaryPts.slice(0, 2).join('. ')
  } else if (body) {
    description = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
  } else if (extracted) {
    description = extracted.replace(/\s+/g, ' ').trim().slice(0, 200)
  }
  if (description.length > 200) description = description.slice(0, 197) + '…'

  const titleSuffix =
    theme        ? ` — ${theme}`
    : item.speaker ? ` — ${item.speaker}`
    : ''

  return {
    title:       `${title}${titleSuffix}`,
    description: description || `${item.content_type} from ${BRAND.parent}`,
    alternates:  metadataAlternates(locale, `/content/${id}`),
    openGraph: {
      title,
      description,
      type:        'article',
      url:         localeUrl(locale, `/content/${id}`),
      images:      item.cover_image_url ? [{ url: item.cover_image_url }] : undefined,
    },
    twitter: {
      card:  item.cover_image_url ? 'summary_large_image' : 'summary',
      title,
      description,
    },
  }
}

export default async function PublicContentDetailPage({ params }: PageParams) {
  const { id, locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()

  const [{ data: rawItem }, { data: attachments }] = await Promise.all([
    supabase
      .from('content')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single(),
    supabase
      .from('content_attachments')
      .select('id, file_url, file_name, file_type, mime_type, size_bytes')
      .eq('content_id', id)
      .order('display_order'),
  ])

  if (!rawItem) notFound()

  const item = rawItem as Parameters<typeof ContentReader>[0]['item']
  const atts = (attachments ?? []) as Parameters<typeof ContentReader>[0]['attachments']

  /* Translation merge — see Step 4-c. */
  let translationStatus: 'native' | 'translated' | 'pending' = 'native'

  if (locale !== item.language) {
    const { data: rawTr } = await supabase
      .from('content_translations')
      .select('title, theme, series, speaker, body_html, extracted_text, summary_points, scripture_refs')
      .eq('content_id', id)
      .eq('locale', locale)
      .maybeSingle()

    const tr = rawTr as {
      title:          string
      theme:          string | null
      series:         string | null
      speaker:        string | null
      body_html:      string | null
      extracted_text: string | null
      summary_points: string[] | null
      scripture_refs: string[]
    } | null

    if (tr) {
      item.title          = tr.title
      item.theme          = tr.theme          ?? item.theme
      item.series         = tr.series         ?? item.series
      item.body_html      = tr.body_html      ?? item.body_html
      item.extracted_text = tr.extracted_text ?? item.extracted_text
      item.summary_points = tr.summary_points ?? item.summary_points
      translationStatus = 'translated'
    } else {
      translationStatus = 'pending'
    }
  }

  let signedPdfUrl: string | null = null
  if (item.source_mode === 'pdf' && item.pdf_url) {
    const { data: signed } = await supabase.storage
      .from('content-pdfs')
      .createSignedUrl(item.pdf_url, 60 * 60)
    signedPdfUrl = signed?.signedUrl ?? null
  }

  // Description for JSON-LD schema (uses the resolved, possibly translated, fields)
  let description = ''
  if (item.summary_points && item.summary_points.length > 0) {
    description = item.summary_points.slice(0, 2).join('. ')
  } else if (item.body_html) {
    description = item.body_html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
  } else if (item.extracted_text) {
    description = item.extracted_text.replace(/\s+/g, ' ').trim().slice(0, 200)
  }

  return (
    <>
      <ArticleSchema
        title={item.title}
        description={description || `${item.content_type} from ${BRAND.parent}`}
        url={localeUrl(locale, `/content/${item.id}`)}
        imageUrl={item.cover_image_url}
        authorName={item.speaker}
        publishedAt={item.created_at}
        updatedAt={item.updated_at}
        contentType={item.content_type}
      />
      <ContentReader
        item={item}
        attachments={atts}
        signedPdfUrl={signedPdfUrl}
        translationStatus={translationStatus}
        sourceLanguage={item.language}
      />
    </>
  )
}