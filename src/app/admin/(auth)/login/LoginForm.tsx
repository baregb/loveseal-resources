'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ButtonSpinner from '@/components/ui/ButtonSpinner'
import { toast } from '@/lib/toast'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Sign-in failed', {
        description: 'Email or password is incorrect.',
      })
      setLoading(false)
      return
    }

    toast.success('Signed in')
    router.push('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        <div>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop:    '0.5rem',
            width:        '100%',
            padding:      '0.75rem',
            background:   loading ? 'var(--bg-elevated)' : 'var(--brand-gold)',
            color:        loading ? 'var(--text-muted)' : 'var(--text-inverse)',
            border:       'none',
            borderRadius: '0.5rem',
            fontSize:     '0.875rem',
            fontWeight:   500,
            cursor:       loading ? 'not-allowed' : 'pointer',
            transition:   'background 0.15s',
            fontFamily:   'var(--font-body)',
            display:      'inline-flex',
            alignItems:   'center',
            justifyContent: 'center',
            minHeight:    '2.75rem',
          }}
        >
          {loading ? <ButtonSpinner label="Signing in…" inverse /> : 'Sign in'}
        </button>

      </div>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  display:       'block',
  fontSize:      '0.75rem',
  fontWeight:    500,
  color:         'var(--text-tertiary)',
  marginBottom:  '0.375rem',
  letterSpacing: '0.04em',
}

const inputStyle: React.CSSProperties = {
  width:         '100%',
  padding:       '0.625rem 0.875rem',
  background:    'var(--bg-input)',
  border:        '0.03125rem solid var(--border-strong)',
  borderRadius:  '0.5rem',
  color:         'var(--text-primary)',
  fontSize:      '0.875rem',
  fontFamily:    'var(--font-body)',
  outline:       'none',
  transition:    'border-color 0.15s',
}