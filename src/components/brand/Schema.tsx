import { BRAND } from './Brand'

interface ArticleSchemaProps {
  title:           string
  description:     string
  url:             string
  imageUrl?:       string | null
  authorName?:     string | null
  publishedAt:     string
  updatedAt:       string
  contentType:     string
}

export function ArticleSchema({
  title, description, url, imageUrl,
  authorName, publishedAt, updatedAt, contentType,
}: ArticleSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const schema = {
    '@context':   'https://schema.org',
    '@type':      contentType === 'blog' ? 'BlogPosting' : 'Article',
    headline:     title,
    description,
    url,
    datePublished: publishedAt,
    dateModified:  updatedAt,
    image:         imageUrl ? [imageUrl] : undefined,
    author: authorName ? {
      '@type': 'Person',
      name:    authorName,
    } : {
      '@type': 'Organization',
      name:    BRAND.parent,
    },
    publisher: {
      '@type': 'Organization',
      name:    BRAND.parent,
      url:     baseUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id':    url,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function OrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const schema = {
    '@context': 'https://schema.org',
    '@type':    'Organization',
    name:        BRAND.parent,
    alternateName: BRAND.short,
    url:         baseUrl,
    description: `Manuals, prophecies, articles, and blog from ${BRAND.parent}.`,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebsiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const schema = {
    '@context': 'https://schema.org',
    '@type':    'WebSite',
    name:        BRAND.short,
    url:         baseUrl,
    potentialAction: {
      '@type':       'SearchAction',
      target:        `${baseUrl}/content?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
