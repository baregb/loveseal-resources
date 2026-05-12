import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/admin-user'
import AdminsList from './AdminsList'
import type { AdminRole } from '@/types'

export const metadata = { title: 'Admins' }

export interface AdminListItem {
  id:             string
  email:          string
  display_name:   string | null
  role:           AdminRole
  invited_at:     string | null
  accepted_at:    string | null
  last_active_at: string | null
  created_at:     string
  invited_by_email: string | null
}

export default async function AdminsPage() {
  const me = await getCurrentAdmin()
  if (!me) redirect('/admin/login')

  const supabase = await createClient()

  // Fetch all admins
  const { data: admins } = await supabase
    .from('admin_users')
    .select('id, email, display_name, role, invited_at, accepted_at, last_active_at, created_at, invited_by')
    .order('created_at', { ascending: false })

  const adminRows = (admins ?? []) as Array<{
    id: string; email: string; display_name: string | null;
    role: AdminRole; invited_at: string | null; accepted_at: string | null;
    last_active_at: string | null; created_at: string; invited_by: string | null
  }>

  // Build a lookup map of inviter ids → emails
  const inviterIds = adminRows.map(a => a.invited_by).filter(Boolean) as string[]
  const inviterMap: Record<string, string> = {}
  if (inviterIds.length > 0) {
    const { data: inviters } = await supabase
      .from('admin_users')
      .select('id, email')
      .in('id', inviterIds)
    const inviterRows = (inviters ?? []) as { id: string; email: string }[]
    inviterRows.forEach(i => { inviterMap[i.id] = i.email })
  }

  const list: AdminListItem[] = adminRows.map(a => ({
    id:               a.id,
    email:            a.email,
    display_name:     a.display_name,
    role:             a.role,
    invited_at:       a.invited_at,
    accepted_at:      a.accepted_at,
    last_active_at:   a.last_active_at,
    created_at:       a.created_at,
    invited_by_email: a.invited_by ? (inviterMap[a.invited_by] ?? null) : null,
  }))

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
            fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px',
          }}>Team</p>
          <h1 style={{
            fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
            fontSize: '32px', fontWeight: 900, textTransform: 'uppercase',
            color: 'var(--text-primary)', lineHeight: 1.0,
          }}>
            Admins
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 400,
              color: 'var(--text-muted)',
              marginLeft: '12px',
              letterSpacing: '0',
              textTransform: 'none',
            }}>
              {list.length} total
            </span>
          </h1>
        </div>
      </div>
      <AdminsList admins={list} currentAdminId={me.id} canManage={me.role === 'super_admin'} />
    </div>
  )
}
