import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ContentList from './ContentList'

export const metadata = { title: 'Content' }

export default async function ContentPage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('content')
    .select(`
      id, title, content_type, status, language, category, tags,
      theme, lesson_number, speaker, series, date_preached, scripture_refs,
      cover_image_url, created_at
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <p style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '6px',
          }}>Library</p>
          <h1 style={{
            fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
            fontSize: '32px',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            lineHeight: 1.0,
          }}>
            Content
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 400,
              color: 'var(--text-muted)',
              marginLeft: '12px',
              letterSpacing: '0',
              textTransform: 'none',
            }}>
              {items?.length ?? 0} items
            </span>
          </h1>
        </div>
        <Link href="/admin/upload" style={{
          padding: '10px 18px',
          background: 'var(--brand-gold)',
          color: 'var(--text-inverse)',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          textDecoration: 'none',
        }}>
          + Upload content
        </Link>
      </div>
      <ContentList items={items ?? []} />
    </div>
  )
}