import LoginForm from './LoginForm'
import { BrandName } from '@/components/brand/Brand'

export const metadata = {
  title: 'Admin Login',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ marginBottom: '12px' }}>
            <BrandName size="md" color="var(--brand-gold)" stacked />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
            fontSize: '32px',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            lineHeight: 1.05,
          }}>
            Admin
          </h1>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
