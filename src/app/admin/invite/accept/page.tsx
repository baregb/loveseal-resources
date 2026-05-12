import { Suspense } from 'react'
import { BrandName } from '@/components/brand/Brand'
import AcceptForm from './AcceptForm'

export const metadata = {
  title: 'Accept Invitation',
  robots: { index: false, follow: false },
}

export default function AcceptInvitePage() {
  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ marginBottom: '24px' }}>
          <BrandName size="md" color="var(--brand-gold)" stacked />
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
          fontSize: '28px',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 1.05,
          marginBottom: '8px',
        }}>
          Welcome
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginBottom: '28px',
          lineHeight: 1.5,
        }}>
          Set a password to activate your admin account.
        </p>

        <Suspense fallback={<div style={{ color: 'var(--text-tertiary)' }}>Loading…</div>}>
          <AcceptForm />
        </Suspense>
      </div>
    </main>
  )
}
