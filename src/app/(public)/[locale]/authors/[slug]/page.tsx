import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { metadataAlternates, localeUrl } from '@/lib/locale-urls'
import { CollectionPageSchema } from '@/components/brand/Schema'
import {
  getAuthorBySlug,
  getContentByAuthor,
  getContentTypesForAuthor,
} from '@/lib/authors'
import AuthorHeader from '@/components/authors/AuthorHeader'
import AuthorTypeFilter from '@/components/authors/AuthorTypeFilter'
import TopicGrid from '@/components/topic/TopicGrid'

export const revalidate = 3600

interface PageParams {
  params:       Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ type?: string }>
}

const CONTENT_TYPES = ['manual', 'prophecy', 'article', 'blog'] as const
type ContentTypeFilter = typeof CONTENT_TYPES[number] | 'all'

function parseTypeFilter(raw: string | undefined): ContentTypeFilter {
  if (!raw) return 'all'
  return (CONTENT_TYPES as readonly string[]).includes(raw)
    ? (raw as ContentTypeFilter)
    : 'all'
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, slug } = await params
  const author = await getAuthorBySlug(slug)
  if (!author) return {}

  const t = await getTranslations({ locale, namespace: 'authors' })
  return {
    title:       `${author.name} — ${t('eyebrow')}`,
    description: author.bio ?? undefined,
    alternates:  metadataAlternates(locale, `/authors/${slug}`),
  }
}

export default async function AuthorProfilePage({ params, searchParams }: PageParams) {
  const { locale, slug } = await params
  const { type }         = await searchParams
  setRequestLocale(locale)

  const author = await getAuthorBySlug(slug)
  if (!author) notFound()

  const typeFilter = parseTypeFilter(type)

  /* Two queries in parallel: full count breakdown (drives the segment row)
     + filtered content list (drives the grid). The counts query is cheap
     enough to repeat per render — ISR absorbs the cost. */
  const [counts, items] = await Promise.all([
    getContentTypesForAuthor(author.id),
    getContentByAuthor(author.id, typeFilter),
  ])

  const tNav     = await getTranslations({ locale, namespace: 'nav' })
  const tAuthors = await getTranslations({ locale, namespace: 'authors' })

  const pageUrl = localeUrl(locale, `/authors/${slug}`)
  const breadcrumb = [
    { name: tNav('home'),            url: localeUrl(locale, '') },
    { name: tAuthors('indexTitle'),  url: localeUrl(locale, '/authors') },
    { name: author.name,             url: pageUrl },
  ]

  /* When a type filter is active, the visible grid is a subset of the
     author's content. Show the subset count rather than the total so the
     header label tracks what the user is actually looking at. */
  const visibleCount = typeFilter === 'all' ? counts.total : items.length

  return (
    <div style={{
      maxWidth: 'var(--width-content)',
      margin:   '0 auto',
      padding:  '2.5rem var(--page-inline-padding) 4rem',
    }}>
      <CollectionPageSchema
        title={author.name}
        description={author.bio ?? tAuthors('profileFallbackBody', { name: author.name })}
        url={pageUrl}
        breadcrumb={breadcrumb}
        inLanguage={locale}
      />

      <AuthorHeader
        name={author.name}
        bio={author.bio}
        avatarUrl={author.avatar_url}
        countLabel={tAuthors('itemsCount', { count: visibleCount })}
        eyebrow={tAuthors('eyebrow')}
      />

      <AuthorTypeFilter counts={counts} />

      <TopicGrid
        items={items}
        emptyMessage={tAuthors('emptyForAuthor', { name: author.name })}
      />
    </div>
  )
}