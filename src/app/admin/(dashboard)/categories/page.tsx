import { createClient } from '@/lib/supabase/server'
import CategoriesManager from './CategoriesManager'
import type { ContentType } from '@/types'

export const metadata = { title: 'Categories' }

export interface CategoryWithCount {
  id: string
  name: string
  slug: string
  content_type: ContentType | null
  usage_count: number
}

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id, name, slug, content_type')
    .order('name')

  const { data: contentData } = await supabase
    .from('content')
    .select('category')

  const categories = (categoriesData ?? []) as {
    id: string
    name: string
    slug: string
    content_type: ContentType | null
  }[]

  const contentRows = (contentData ?? []) as { category: string }[]

  const usageMap: Record<string, number> = {}
  contentRows.forEach(row => {
    if (row.category) {
      usageMap[row.category] = (usageMap[row.category] ?? 0) + 1
    }
  })

  const categoriesWithCounts: CategoryWithCount[] = categories.map(c => ({
    id:           c.id,
    name:         c.name,
    slug:         c.slug,
    content_type: c.content_type,
    usage_count:  usageMap[c.slug] ?? 0,
  }))

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px',
        }}>Library</p>
        <h1 style={{
          fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
          fontSize: '32px', fontWeight: 900, textTransform: 'uppercase',
          color: 'var(--text-primary)', lineHeight: 1.0,
        }}>
          Categories
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 400,
            color: 'var(--text-muted)',
            marginLeft: '12px',
            letterSpacing: '0',
            textTransform: 'none',
          }}>
            {categoriesWithCounts.length} total
          </span>
        </h1>
      </div>
      <CategoriesManager initialCategories={categoriesWithCounts} />
    </div>
  )
}