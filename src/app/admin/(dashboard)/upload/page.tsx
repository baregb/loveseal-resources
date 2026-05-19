import { createClient } from '@/lib/supabase/server'
import UploadForm from './UploadForm'

export const metadata = { title: 'Upload Content' }

export default async function UploadPage() {
  const supabase = await createClient()
  const [{ data: categories }, { data: authors }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, content_type')
      .order('name'),
    supabase
      .from('authors')
      .select('id, name, slug, avatar_url')
      .order('name'),
  ])

  const cats    = (categories ?? []) as Parameters<typeof UploadForm>[0]['categories']
  const authorList = (authors ?? []) as Parameters<typeof UploadForm>[0]['authors']

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px',
        }}>Content</p>
        <h1 style={{
          fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
          fontSize: '32px', fontWeight: 900, textTransform: 'uppercase',
          color: 'var(--text-primary)', lineHeight: 1.0,
        }}>Upload</h1>
      </div>
      <UploadForm categories={cats} authors={authorList} />
    </div>
  )
}