'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { BrandName, BRAND } from '@/components/brand/Brand'

export default function PublicFooter() {
  const t = useTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer style={{
      borderTop: '0.5px solid var(--border-subtle)',
      background: 'var(--bg-base)',
      marginTop: '64px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 24px 32px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '32px',
        }}>

          <div>
            <BrandName size="md" color="var(--text-primary)" stacked />
            <p style={{
              fontSize: '13px',
              color: 'var(--text-tertiary)',
              marginTop: '14px',
              maxWidth: '420px',
              lineHeight: 1.6,
            }}>
              {t('tagline', { parent: BRAND.parent })}
            </p>
          </div>

          <div className="footer-columns" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
          }}>
            <FooterColumn label={t('columns.content')}>
              <FooterLink href={{ pathname: '/content', query: { type: 'manual' } }}>{t('links.manuals')}</FooterLink>
              <FooterLink href={{ pathname: '/content', query: { type: 'prophecy' } }}>{t('links.prophecies')}</FooterLink>
              <FooterLink href={{ pathname: '/content', query: { type: 'article' } }}>{t('links.articles')}</FooterLink>
              <FooterLink href={{ pathname: '/content', query: { type: 'blog' } }}>{t('links.blog')}</FooterLink>
            </FooterColumn>
            <FooterColumn label={t('columns.browse')}>
              <FooterLink href="/content">{t('links.allContent')}</FooterLink>
              <FooterLink href="/">{t('links.home')}</FooterLink>
            </FooterColumn>
            <FooterColumn label={t('columns.admin')}>
              {/* Admin is locale-agnostic - use plain anchor */}
              <a href="/admin/login" style={footerLinkStyle}>{t('links.signin')}</a>
            </FooterColumn>
          </div>
        </div>

        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '0.5px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}>
          <span>{t('copyright', { year, parent: BRAND.parent })}</span>
          <span>{BRAND.full}</span>
        </div>
      </div>

      <style>{`
        @media (min-width: 720px) {
          footer > div > div:first-child {
            grid-template-columns: 1.4fr 2fr !important;
            gap: 64px !important;
          }
        }
      `}</style>
    </footer>
  )
}

function FooterColumn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: '10px',
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: '12px',
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {children}
      </div>
    </div>
  )
}

interface FooterLinkProps {
  href:     string | { pathname: string; query?: Record<string, string> }
  children: React.ReactNode
}

function FooterLink({ href, children }: FooterLinkProps) {
  return (
    // @ts-expect-error -- next-intl Link href accepts both strings and pathname objects at runtime
    <Link href={href} style={footerLinkStyle}>{children}</Link>
  )
}

const footerLinkStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  transition: 'color 0.12s',
}
