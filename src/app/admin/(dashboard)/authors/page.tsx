import Link from 'next/link'
import { getAllAuthorsWithCounts } from '@/lib/authors'
import AuthorsList from './AuthorsList'

export const metadata = { title: 'Authors' }

export default async function AdminAuthorsPage() {
  const authors = await getAllAuthorsWithCounts()

  return (
    <div>
      <div style={{
        marginBottom: '24px',
        display:      'flex',
        alignItems:   'flex-end',
        justifyContent: 'space-between',
        gap:          '16px',
        flexWrap:     'wrap',
      }}>
        <div>
          <p style={{
            fontSize:      '11px',
            fontWeight:    500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color:         'var(--text-muted)',
            marginBottom:  '6px',
          }}>
            People
          </p>
          <h1 style={{
            fontFamily:    'var(--font-display), Barlow Condensed, sans-serif',
            fontSize:      '32px',
            fontWeight:    900,
            textTransform: 'uppercase',
            color:         'var(--text-primary)',
            lineHeight:    1.0,
          }}>
            Authors
          </h1>
        </div>

        <Link
          href="/admin/authors/new"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            padding:        '9px 16px',
            background:     'var(--brand-gold)',
            color:          'var(--text-inverse)',
            borderRadius:   '7px',
            fontSize:       '13px',
            fontWeight:     500,
            textDecoration: 'none',
          }}
        >
          + New author
        </Link>
      </div>

      <AuthorsList authors={authors} />
    </div>
  )
}