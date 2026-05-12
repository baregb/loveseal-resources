'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AcceptForm() {
  const router = useRouter()
  const [password, setPassword]       = useState('')
  const [confirmPwd, setConfirmPwd]   = useState('')
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [userEmail, setUserEmail]     = useState<string | null>(null)

  // On mount: Supabase auto-detects the magic-link tokens from the URL hash
  // and creates a session. We just wait for that session to be ready.
  useEffect(() => {
    const supabase = createClient()

    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserEmail(session.user.email ?? null)
        setSessionReady(true)
      } else {
        // Listen for the auth change after Supabase processes the URL
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            setUserEmail(session.user.email ?? null)
            setSessionReady(true)
            subscription.unsubscribe()
          }
        })
        // Give it a moment then surface an error if nothing happens
        setTimeout(() => {
          if (!sessionReady) {
            setError('This invite link is invalid or has expired. Ask a super-admin to resend it.')
          }
        }, 2500)
      }
    }
    check()
  }, [sessionReady])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPwd) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const supabase = createClient()

    // Set the password
    const { error: updateErr, data: { user } } = await supabase.auth.updateUser({ password })
    if (updateErr || !user) {
      setError(updateErr?.message ?? 'Failed to set password')
      setLoading(false)
      return
    }

    // Mark the admin_users row as accepted
    await (supabase
      .from('admin_users')
      .update({ accepted_at: new Date().toISOString() } as never)
      .eq('id', user.id))

    router.push('/admin')
    router.refresh()
  }

  if (!sessionReady && !error) {
    return (
      <div style={{
        padding: '20px',
        background: 'var(--bg-raised)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: '8px',
        fontSize: '13px',
        color: 'var(--text-tertiary)',
        textAlign: 'center',
      }}>
        Verifying invite link…
      </div>
    )
  }

  if (error && !sessionReady) {
    return (
      <div style={{
        padding: '14px 16px',
        background: 'var(--danger-bg)',
        border: '0.5px solid var(--danger-border)',
        borderRadius: '8px',
        fontSize: '13px',
        color: 'var(--danger-fg)',
        lineHeight: 1.5,
      }}>
        {error}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {userEmail && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-elevated)',
          border: '0.5px solid var(--border-subtle)',
          borderRadius: '7px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          marginBottom: '16px',
        }}>
          Setting up account for <strong style={{ color: 'var(--text-primary)' }}>{userEmail}</strong>
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
          placeholder="At least 8 characters"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Confirm password</label>
        <input
          type="password"
          value={confirmPwd}
          onChange={e => setConfirmPwd(e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
          style={inputStyle}
        />
      </div>

      {error && (
        <div style={{
          padding: '10px 12px',
          background: 'var(--danger-bg)',
          border: '0.5px solid var(--danger-border)',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--danger-fg)',
          marginBottom: '14px',
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '11px',
          background: loading ? 'var(--bg-elevated)' : 'var(--brand-gold)',
          color: loading ? 'var(--text-muted)' : 'var(--text-inverse)',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        {loading ? 'Setting up…' : 'Activate account'}
      </button>
    </form>
  )
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
  padding: '10px 14px',
  background: 'var(--bg-input)',
  border: '0.5px solid var(--border-strong)',
  borderRadius: '7px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  fontFamily: 'var(--font-body)',
  outline: 'none',
}
