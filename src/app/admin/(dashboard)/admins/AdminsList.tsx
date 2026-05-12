'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { inviteAdmin, removeAdmin, changeAdminRole, resendInvite } from './actions'
import type { AdminRole } from '@/types'
import type { AdminListItem } from './page'

interface Props {
  admins:          AdminListItem[]
  currentAdminId:  string
  canManage:       boolean
}

export default function AdminsList({ admins, currentAdminId, canManage }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [showInvite, setShowInvite] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [busy, setBusy]             = useState<string | null>(null)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName]   = useState('')
  const [inviteRole, setInviteRole]   = useState<AdminRole>('admin')

  function handleInvite() {
    setError(null)
    startTransition(async () => {
      const result = await inviteAdmin(inviteEmail, inviteRole, inviteName)
      if (!result.ok) {
        setError(result.error ?? 'Invite failed')
        return
      }
      setShowInvite(false)
      setInviteEmail('')
      setInviteName('')
      setInviteRole('admin')
      router.refresh()
    })
  }

  function handleRemove(admin: AdminListItem) {
    const msg = `Remove ${admin.email}? They will lose all access immediately.`
    if (!confirm(msg)) return
    setBusy(admin.id)
    setError(null)
    startTransition(async () => {
      const result = await removeAdmin(admin.id)
      if (!result.ok) setError(result.error ?? 'Remove failed')
      setBusy(null)
      router.refresh()
    })
  }

  function handleRoleChange(admin: AdminListItem, newRole: AdminRole) {
    setBusy(admin.id)
    setError(null)
    startTransition(async () => {
      const result = await changeAdminRole(admin.id, newRole)
      if (!result.ok) setError(result.error ?? 'Role change failed')
      setBusy(null)
      router.refresh()
    })
  }

  function handleResend(admin: AdminListItem) {
    setBusy(admin.id)
    setError(null)
    startTransition(async () => {
      const result = await resendInvite(admin.id)
      if (!result.ok) setError(result.error ?? 'Resend failed')
      else alert(`Invite re-sent to ${admin.email}`)
      setBusy(null)
    })
  }

  function formatDate(s: string | null) {
    if (!s) return '—'
    const d = new Date(s)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7)   return `${diffDays}d ago`
    return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: '2-digit' })
  }

  return (
    <>
      {/* Action bar */}
      {canManage && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => { setShowInvite(true); setError(null) }}
            style={primaryBtn}
          >
            + Invite admin
          </button>
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--danger-bg)',
          border: '0.5px solid var(--danger-border)',
          borderRadius: '8px',
          fontSize: '13px',
          color: 'var(--danger-fg)',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{
        background: 'var(--bg-raised)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: '10px',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-table-head)', borderBottom: '0.5px solid var(--border-subtle)' }}>
              <th style={thStyle}>Admin</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Invited by</th>
              <th style={thStyle}>Joined</th>
              {canManage && <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => {
              const isMe         = admin.id === currentAdminId
              const isBusy       = busy === admin.id
              const isPending    = !admin.accepted_at
              return (
                <tr key={admin.id} style={{
                  borderBottom: '0.5px solid var(--border-subtle)',
                  opacity: isBusy ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #F5AE41 0%, #C32126 100%)',
                        color: '#212529',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        {(admin.display_name ?? admin.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {admin.display_name ?? admin.email.split('@')[0]}
                          {isMe && (
                            <span style={{
                              fontSize: '10px',
                              color: 'var(--brand-gold)',
                              marginLeft: '6px',
                              fontWeight: 400,
                            }}>(you)</span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                          {admin.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    {canManage && !isMe ? (
                      <select
                        value={admin.role}
                        onChange={e => handleRoleChange(admin, e.target.value as AdminRole)}
                        disabled={isBusy || isPending}
                        style={{
                          padding: '4px 8px',
                          background: 'var(--bg-input)',
                          border: '0.5px solid var(--border-strong)',
                          borderRadius: '5px',
                          color: 'var(--text-primary)',
                          fontSize: '11px',
                          fontFamily: 'var(--font-body)',
                          outline: 'none',
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    ) : (
                      <RoleBadge role={admin.role} />
                    )}
                  </td>
                  <td style={tdStyle}>
                    {isPending ? (
                      <span style={pendingPill}>Pending</span>
                    ) : (
                      <span style={activePill}>Active</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                    {admin.invited_by_email ?? '—'}
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-tertiary)', fontSize: '11px' }}>
                    {formatDate(admin.accepted_at ?? admin.created_at)}
                  </td>
                  {canManage && (
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        {isPending && !isMe && (
                          <button
                            type="button"
                            onClick={() => handleResend(admin)}
                            disabled={isBusy}
                            style={textBtn}
                            title="Resend invite"
                          >
                            Resend
                          </button>
                        )}
                        {!isMe && (
                          <button
                            type="button"
                            onClick={() => handleRemove(admin)}
                            disabled={isBusy}
                            style={{ ...iconBtn, color: 'var(--danger-fg)' }}
                            title="Remove"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div
          onClick={() => !isPending && setShowInvite(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-raised)',
              border: '0.5px solid var(--border-strong)',
              borderRadius: '12px',
              padding: '28px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h2 style={{
              fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
              fontSize: '22px',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              marginBottom: '20px',
            }}>
              Invite admin
            </h2>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="newadmin@example.com"
                autoFocus
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Display name (optional)</label>
              <input
                type="text"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                placeholder="Pastor John"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Role</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['admin', 'super_admin'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setInviteRole(r)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: inviteRole === r ? 'var(--brand-gold)' : 'transparent',
                      color: inviteRole === r ? 'var(--text-inverse)' : 'var(--text-tertiary)',
                      border: `0.5px solid ${inviteRole === r ? 'var(--brand-gold)' : 'var(--border-strong)'}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {r === 'admin' ? 'Admin' : 'Super Admin'}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {inviteRole === 'super_admin'
                  ? 'Can invite/remove admins and manage all content.'
                  : 'Can manage all content but not other admins.'}
              </p>
            </div>

            {error && (
              <div style={{
                padding: '10px 12px',
                background: 'var(--danger-bg)',
                border: '0.5px solid var(--danger-border)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--danger-fg)',
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                disabled={isPending}
                style={cancelBtnStyle}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInvite}
                disabled={isPending || !inviteEmail.trim()}
                style={{
                  ...primaryBtn,
                  opacity: isPending || !inviteEmail.trim() ? 0.5 : 1,
                  cursor: isPending || !inviteEmail.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Sending invite…' : 'Send invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function RoleBadge({ role }: { role: AdminRole }) {
  const isSuper = role === 'super_admin'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 9px',
      borderRadius: '20px',
      fontSize: '10px',
      fontWeight: 500,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      background: isSuper ? 'rgba(245,174,65,0.15)' : 'var(--bg-elevated)',
      color: isSuper ? 'var(--brand-gold)' : 'var(--text-secondary)',
    }}>
      {isSuper && <span>★</span>}
      {isSuper ? 'Super Admin' : 'Admin'}
    </span>
  )
}

const primaryBtn: React.CSSProperties = {
  padding: '8px 16px',
  background: 'var(--brand-gold)',
  color: 'var(--text-inverse)',
  border: 'none',
  borderRadius: '7px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: 'transparent',
  border: '0.5px solid var(--border-strong)',
  borderRadius: '7px',
  color: 'var(--text-tertiary)',
  fontSize: '12px',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const textBtn: React.CSSProperties = {
  padding: '4px 9px',
  background: 'transparent',
  border: '0.5px solid var(--border-strong)',
  borderRadius: '5px',
  color: 'var(--text-secondary)',
  fontSize: '11px',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const iconBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  background: 'transparent',
  border: '0.5px solid var(--border-strong)',
  borderRadius: '5px',
  color: 'var(--text-tertiary)',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--text-tertiary)',
  marginBottom: '6px',
  letterSpacing: '0.04em',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: 'var(--bg-input)',
  border: '0.5px solid var(--border-strong)',
  borderRadius: '7px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  fontFamily: 'var(--font-body)',
  outline: 'none',
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left',
  fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 14px', color: 'var(--text-primary)', verticalAlign: 'middle',
}

const pendingPill: React.CSSProperties = {
  display: 'inline-block',
  padding: '3px 9px',
  borderRadius: '20px',
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  background: 'rgba(245,174,65,0.15)',
  color: 'var(--brand-gold)',
}

const activePill: React.CSSProperties = {
  display: 'inline-block',
  padding: '3px 9px',
  borderRadius: '20px',
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  background: 'rgba(76,175,80,0.12)',
  color: 'var(--success-fg)',
}
