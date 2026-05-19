import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AuthorEditForm from './AuthorEditForm'

export const metadata = { title: 'Edit author' }

interface PageParams {
  params: Promise<{ id: string }>
}

export default async function AuthorEditPage({ params }: PageParams) {
  const { id } = await params

  /* Special path: `/admin/authors/new` shares this route. We detect it by
     literal slug rather than separating into two route files because the
     editor form is identical except for the empty-state seed. */
  const isNew = id === 'new'

  let initial: Parameters<typeof AuthorEditForm>[0]['initial'] = {
    id:         '',
    name:       '',
    slug:       '',
    bio:        '',
    avatar_url: null,
  }

  if (!isNew) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('authors')
      .select('id, name, slug, bio, avatar_url')
      .eq('id', id)
      .single()
    if (!data) notFound()
    const row = data as {
      id: string; name: string; slug: string
      bio: string | null; avatar_url: string | null
    }
    initial = {
      id:         row.id,
      name:       row.name,
      slug:       row.slug,
      bio:        row.bio ?? '',
      avatar_url: row.avatar_url,
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin/authors" style={{
          fontSize:       '12px',
          color:          'var(--text-tertiary)',
          textDecoration: 'none',
        }}>
          ← Back to authors
        </Link>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontSize:      '11px',
          fontWeight:    500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color:         'var(--text-muted)',
          marginBottom:  '6px',
        }}>
          {isNew ? 'New author' : 'Edit author'}
        </p>
        <h1 style={{
          fontFamily:    'var(--font-display), Barlow Condensed, sans-serif',
          fontSize:      '28px',
          fontWeight:    900,
          textTransform: 'uppercase',
          color:         'var(--text-primary)',
          lineHeight:    1.05,
        }}>
          {isNew ? 'New author' : initial.name}
        </h1>
      </div>

      <AuthorEditForm initial={initial} isNew={isNew} />
    </div>
  )
}