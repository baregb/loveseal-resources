export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: '#212529',
        color: '#F8F9FA',
        fontFamily: 'var(--font-body)',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 8vw, 96px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          lineHeight: 0.95,
          textAlign: 'center',
          color: '#F5AE41',
        }}
      >
        Love Seal<br />Church
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', letterSpacing: '0.1em' }}>
        PHASE 1 — FOUNDATION COMPLETE ✓
      </p>
    </main>
  )
}
