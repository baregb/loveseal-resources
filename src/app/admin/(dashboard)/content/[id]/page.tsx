import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import EditForm from './EditForm'

export const metadata = { title: 'Edit content' }

export default async function ContentEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  /* Pass 5c — added the authors fetch alongside content/categories/attachments.
     Four parallel queries. */
  const [
    { data: item },
    { data: categories },
    { data: authors },
    { data: attachments },
  ] = await Promise.all([
    supabase.from('content').select('*').eq('id', id).single(),
    supabase.from('categories').select('id, name, slug, content_type').order('name'),
    supabase.from('authors').select('id, name, slug, avatar_url').order('name'),
    supabase
      .from('content_attachments')
      .select('id, file_url, file_name, file_type, mime_type, size_bytes')
      .eq('content_id', id)
      .order('display_order'),
  ])

  if (!item) notFound()

  const itemTyped         = item as Parameters<typeof EditForm>[0]['item']
  const categoriesTyped   = (categories ?? [])   as Parameters<typeof EditForm>[0]['categories']
  const authorsTyped      = (authors ?? [])      as Parameters<typeof EditForm>[0]['authors']
  const attachmentsTyped  = (attachments ?? [])  as Parameters<typeof EditForm>[0]['existingAttachments']

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin/content" style={{
          fontSize: '12px',
          color: 'var(--text-tertiary)',
          textDecoration: 'none',
        }}>
          ← Back to content
        </Link>
      </div>
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '6px',
        }}>
          Edit content
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
          fontSize: '28px',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 1.05,
        }}>
          {itemTyped.title}
        </h1>
      </div>
      <EditForm
        item={itemTyped}
        categories={categoriesTyped}
        authors={authorsTyped}
        existingAttachments={attachmentsTyped}
      />
    </div>
  )
}