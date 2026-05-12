import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/admin-user'
import AuditLogList from './AuditLogList'
import type { AuditAction } from '@/types'

export const metadata = { title: 'Audit Log' }

export interface AuditLogRow {
  id:             string
  actor_id:       string | null
  actor_email:    string
  action:         AuditAction
  resource_type:  string
  resource_id:    string | null
  resource_label: string | null
  metadata:       Record<string, unknown> | null
  created_at:     string
}

export default async function AuditLogPage() {
  const me = await getCurrentAdmin()
  if (!me) redirect('/admin/login')

  const supabase = await createClient()
  const { data: rawEntries } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const entries = (rawEntries ?? []) as AuditLogRow[]

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px',
        }}>Accountability</p>
        <h1 style={{
          fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
          fontSize: '32px', fontWeight: 900, textTransform: 'uppercase',
          color: 'var(--text-primary)', lineHeight: 1.0,
        }}>
          Audit Log
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 400,
            color: 'var(--text-muted)',
            marginLeft: '12px',
            letterSpacing: '0',
            textTransform: 'none',
          }}>
            {entries.length} recent {entries.length === 1 ? 'event' : 'events'}
          </span>
        </h1>
      </div>
      <AuditLogList entries={entries} />
    </div>
  )
}
