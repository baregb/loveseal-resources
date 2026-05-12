import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RecentUploadsTable from '@/components/admin/RecentUploadsTable'

export const metadata = { title: 'Admin Dashboard' }

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: total },
    { count: published },
    { count: drafts },
    { count: manuals },
    { count: prophecies },
    { count: articles },
    { count: blogs },
    { data: recent },
  ] = await Promise.all([
    supabase.from('content').select('*', { count: 'exact', head: true }),
    supabase.from('content').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('content').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('content').select('*', { count: 'exact', head: true }).eq('content_type', 'manual'),
    supabase.from('content').select('*', { count: 'exact', head: true }).eq('content_type', 'prophecy'),
    supabase.from('content').select('*', { count: 'exact', head: true }).eq('content_type', 'article'),
    supabase.from('content').select('*', { count: 'exact', head: true }).eq('content_type', 'blog'),
    supabase
      .from('content')
      .select('id, title, content_type, status, language, theme, speaker, date_preached, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const heroStats = [
    { label: 'Total content', value: total ?? 0,     accent: 'var(--brand-gold)' },
    { label: 'Published',     value: published ?? 0, accent: 'var(--brand-blue)' },
    { label: 'Drafts',        value: drafts ?? 0,    accent: 'var(--text-tertiary)' },
  ]

  const typeStats = [
    { label: 'Manuals',    value: manuals ?? 0,    color: '#4498CC' },
    { label: 'Prophecies', value: prophecies ?? 0, color: '#C32126' },
    { label: 'Articles',   value: articles ?? 0,   color: '#F5AE41' },
    { label: 'Blog',       value: blogs ?? 0,      color: '#3C3C3C' },
  ]

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <p style={eyebrowStyle}>Overview</p>
          <h1 style={pageTitleStyle}>Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/admin/upload"  style={primaryBtn}>+ Upload content</Link>
          <Link href="/admin/content" style={secondaryBtn}>View all</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
        {heroStats.map(stat => (
          <div key={stat.label} style={{
            background: 'var(--bg-raised)',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '24px 28px',
          }}>
            <div style={{
              fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
              fontSize: '52px',
              fontWeight: 900,
              color: stat.accent,
              lineHeight: 0.95,
              marginBottom: '8px',
              letterSpacing: '-0.01em',
            }}>{stat.value}</div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '36px' }}>
        {typeStats.map(stat => (
          <div key={stat.label} style={{
            background: 'var(--bg-raised)',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{ width: '8px', height: '32px', borderRadius: '4px', background: stat.color, flexShrink: 0 }} />
            <div>
              <div style={{
                fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
                fontSize: '24px',
                fontWeight: 900,
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '3px', letterSpacing: '0.04em' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}>
            Recent uploads
          </h2>
          <Link href="/admin/content" style={{ fontSize: '12px', color: 'var(--brand-gold)', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>
        <RecentUploadsTable items={recent ?? []} />
      </div>
    </div>
  )
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '6px',
}

const pageTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
  fontSize: '32px',
  fontWeight: 900,
  textTransform: 'uppercase',
  color: 'var(--text-primary)',
  lineHeight: 1.0,
}

const primaryBtn: React.CSSProperties = {
  padding: '10px 18px',
  background: 'var(--brand-gold)',
  color: 'var(--text-inverse)',
  border: 'none',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 500,
  textDecoration: 'none',
  fontFamily: 'var(--font-body)',
  display: 'inline-block',
}

const secondaryBtn: React.CSSProperties = {
  padding: '10px 18px',
  background: 'transparent',
  color: 'var(--text-primary)',
  border: '0.5px solid var(--border-strong)',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 500,
  textDecoration: 'none',
  fontFamily: 'var(--font-body)',
  display: 'inline-block',
}
