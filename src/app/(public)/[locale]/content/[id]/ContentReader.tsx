'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import '@/components/editor/editor.css'

interface Item {
  id: string
  title: string
  content_type: 'manual' | 'prophecy' | 'article' | 'blog'
  source_mode: 'pdf' | 'editor'
  category: string
  tags: string[]
  theme: string | null
  lesson_number: string | null
  speaker: string | null
  series: string | null
  date_preached: string | null
  scripture_refs: string[]
  extracted_text: string | null
  body_html: string | null
  summary_points: string[] | null
  pdf_url: string | null
  cover_image_url: string | null
  language: string
  created_at: string
  updated_at: string
}

interface Attachment {
  id: string
  file_url: string
  file_name: string
  file_type: 'pdf' | 'image' | 'audio' | 'other'
  mime_type: string
  size_bytes: number
}

const TYPE_COLORS: Record<string, string> = {
  manual: '#4498CC', prophecy: '#C32126', article: '#F5AE41', blog: '#3C3C3C',
}

type ReadMode = 'full' | 'key'

function countWords(text: string | null): number {
  if (!text) return 0
  return text.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim().split(/\s+/).filter(Boolean).length
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function ContentReader({
  item, attachments, signedPdfUrl,
  translationStatus = 'native',
  sourceLanguage,
}: {
  item:              Item
  attachments:       Attachment[]
  signedPdfUrl:      string | null
  translationStatus?: 'native' | 'translated' | 'pending'
  sourceLanguage?:    string
}) {
  const t        = useTranslations('content')
  const tTypes   = useTranslations('content.types')
  const tBread   = useTranslations('content.breadcrumb')
  const locale   = useLocale()
  const isRtl    = locale === 'ar'

  const [mode, setMode]             = useState<ReadMode>('full')
  const [linkCopied, setLinkCopied] = useState(false)

  const hasKeyPoints = item.summary_points && item.summary_points.length > 0
  const isPdfMode    = item.source_mode === 'pdf'
  const wordCount    = isPdfMode ? countWords(item.extracted_text) : countWords(item.body_html)
  const readMin      = Math.max(1, Math.ceil(wordCount / 220))

  const dateString = item.date_preached
    ? new Date(item.date_preached).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date(item.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, url })
      } catch { /* cancelled */ }
    } else {
      await handleCopyLink()
    }
  }

  async function handleCopyLink() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1800)
    } catch {
      alert(url)
    }
  }

  return (
    <article style={{
      maxWidth: '780px',
      margin: '0 auto',
      padding: '40px 24px 80px',
    }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
        <Link href="/" style={breadcrumbLink}>{tBread('home')}</Link>
        <span style={{ margin: '0 6px', color: 'var(--text-faint)' }}>/</span>
        <Link href="/content" style={breadcrumbLink}>{tBread('content')}</Link>
        <span style={{ margin: '0 6px', color: 'var(--text-faint)' }}>/</span>
        <Link
          href={{ pathname: '/content', query: { type: item.content_type } }}
          style={breadcrumbLink}
        >
          {tTypes(item.content_type)}
        </Link>
      </nav>

      {/* Translation banner (only when content is being read in a non-source locale) */}
        {translationStatus !== 'native' && (
          <div
            role="note"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              marginBottom: '20px',
              background: translationStatus === 'pending'
                ? 'var(--warning-bg, rgba(245, 174, 65, 0.10))'
                : 'var(--info-bg, rgba(68, 152, 204, 0.08))',
              border: `0.5px solid ${
                translationStatus === 'pending'
                  ? 'var(--warning-border, rgba(245, 174, 65, 0.35))'
                  : 'var(--info-border, rgba(68, 152, 204, 0.30))'
              }`,
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontSize: '14px', flexShrink: 0 }} aria-hidden>
              {translationStatus === 'pending' ? '⚠' : '🌐'}
            </span>
            <span style={{ flex: 1 }}>
              {translationStatus === 'translated'
                ? t('translatedNotice')
                : t('pendingTranslationNotice', { source: sourceLanguage ?? '' })}
            </span>
          </div>
        )}

      {/* Type pill + lesson badge */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '4px 11px',
          background: TYPE_COLORS[item.content_type],
          color: '#FFFFFF',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          borderRadius: '20px',
        }}>
          {tTypes(item.content_type)}
        </span>
        {item.lesson_number && (
          <span style={{
            padding: '4px 11px',
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            borderRadius: '20px',
          }}>
            {t('lesson', { number: item.lesson_number })}
          </span>
        )}
      </div>

      {/* Theme + Series */}
      {(item.theme || item.series) && (
        <div style={{
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '12px',
        }}>
          {item.theme}
          {item.theme && item.series && ' · '}
          {item.series}
        </div>
      )}

      {/* Title */}
      <h1 style={{
        fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
        fontSize: 'clamp(32px, 5vw, 52px)',
        fontWeight: 900,
        textTransform: 'uppercase',
        color: 'var(--text-primary)',
        lineHeight: 1.0,
        letterSpacing: '-0.01em',
        marginBottom: '20px',
      }}>
        {item.title}
      </h1>

      {/* Meta */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '0.5px solid var(--border-subtle)',
        fontSize: '13px',
        color: 'var(--text-tertiary)',
      }}>
        {item.speaker && (
          <span style={{ color: 'var(--text-secondary)' }}>{item.speaker}</span>
        )}
        <span>{dateString}</span>
        {wordCount > 0 && (
          <span>· {t('minRead', { count: readMin })}</span>
        )}
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <ActionButton onClick={handleShare} icon={<ShareIcon />}>{t('share')}</ActionButton>
        <ActionButton onClick={handleCopyLink} icon={linkCopied ? <CheckIcon /> : <LinkIcon />}>
          {linkCopied ? t('linkCopied') : t('copyLink')}
        </ActionButton>
        {isPdfMode && signedPdfUrl && (
          <a
            href={signedPdfUrl}
            download
            style={{
              ...actionBtnStyle,
              background: 'var(--brand-gold)',
              color: 'var(--text-inverse)',
              borderColor: 'var(--brand-gold)',
              textDecoration: 'none',
            }}
          >
            <DownloadIcon /> {t('downloadPdf')}
          </a>
        )}
      </div>

      {item.cover_image_url && (
        <div style={{
          aspectRatio: '16 / 9',
          background: `url(${item.cover_image_url}) center/cover`,
          borderRadius: '12px',
          marginBottom: '32px',
          overflow: 'hidden',
        }} />
      )}

      {hasKeyPoints && !isPdfMode && (
        <div style={{
          display: 'inline-flex',
          background: 'var(--bg-raised)',
          border: '0.5px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '3px',
          marginBottom: '20px',
        }}>
          <ModeBtn active={mode === 'full'} onClick={() => setMode('full')}>{t('fullText')}</ModeBtn>
          <ModeBtn active={mode === 'key'}  onClick={() => setMode('key')}>{t('keyPoints')}</ModeBtn>
        </div>
      )}

      {isPdfMode ? (
        <PdfViewer
          signedUrl={signedPdfUrl}
          title={item.title}
          extractedText={item.extracted_text}
          tPdfViewer={t('pdfViewer')}
          tPlainText={t('plainText')}
          tUnavailable={t('pdfUnavailable')}
        />
      ) : mode === 'key' && hasKeyPoints ? (
        <KeyPointsView points={item.summary_points!} />
      ) : (
        <div className="lr-editor-content" style={{
          background: 'transparent',
          padding: 0,
          minHeight: 'auto',
          maxHeight: 'none',
          fontSize: '17px',
          lineHeight: 1.75,
          textAlign: 'start',
        }}
        dangerouslySetInnerHTML={{ __html: item.body_html ?? '' }}
        />
      )}

      {item.scripture_refs.length > 0 && (
        <section style={{ marginTop: '40px', paddingTop: '24px', borderTop: '0.5px solid var(--border-subtle)' }}>
          <h2 style={sectionHeadingStyle}>{t('scriptureRefs')}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {item.scripture_refs.map(ref => (
              <span key={ref} style={{
                padding: '5px 11px',
                background: 'rgba(245,174,65,0.08)',
                border: '0.5px solid rgba(245,174,65,0.3)',
                borderRadius: '20px',
                fontSize: '12px',
                color: 'var(--brand-gold)',
                fontWeight: 500,
              }}>
                {ref}
              </span>
            ))}
          </div>
        </section>
      )}

      {item.tags.length > 0 && (
        <section style={{ marginTop: '24px' }}>
          <h2 style={sectionHeadingStyle}>{t('tags')}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {item.tags.map(tag => (
              <span key={tag} style={{
                padding: '4px 10px',
                background: 'var(--bg-elevated)',
                borderRadius: '20px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
              }}>
                #{tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {attachments.length > 0 && (
        <section style={{ marginTop: '40px', paddingTop: '24px', borderTop: '0.5px solid var(--border-subtle)' }}>
          <h2 style={sectionHeadingStyle}>{t('attachments')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {attachments.map(att => <AttachmentRow key={att.id} att={att} />)}
          </div>
        </section>
      )}

      <section style={{
        marginTop: '48px',
        paddingTop: '24px',
        borderTop: '0.5px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <Link href="/content" style={{
          fontSize: '13px',
          color: 'var(--text-tertiary)',
          textDecoration: 'none',
        }}>
          {t('backToAll')}
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ActionButton onClick={handleShare} icon={<ShareIcon />}>{t('share')}</ActionButton>
          <ActionButton onClick={handleCopyLink} icon={linkCopied ? <CheckIcon /> : <LinkIcon />}>
            {linkCopied ? t('copied') : t('copyLink')}
          </ActionButton>
        </div>
      </section>
    </article>
  )
}

function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 14px',
        background: active ? 'var(--bg-elevated)' : 'transparent',
        color: active ? 'var(--brand-gold)' : 'var(--text-tertiary)',
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: active ? 500 : 400,
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.02em',
        transition: 'all 0.12s',
      }}
    >
      {children}
    </button>
  )
}

function ActionButton({
  onClick, icon, children,
}: {
  onClick: () => void
  icon:    React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick} style={actionBtnStyle}>
      {icon} {children}
    </button>
  )
}

function KeyPointsView({ points }: { points: string[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {points.map((p, idx) => (
        <div
          key={idx}
          style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr',
            gap: '14px',
            padding: '16px 18px',
            background: 'var(--bg-raised)',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: '10px',
            alignItems: 'flex-start',
          }}
        >
          <span style={{
            fontFamily: 'var(--font-display), Barlow Condensed, sans-serif',
            fontSize: '20px',
            fontWeight: 900,
            color: 'var(--brand-gold)',
            lineHeight: 1,
          }}>
            {String(idx + 1).padStart(2, '0')}
          </span>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-primary)',
            lineHeight: 1.6,
            margin: 0,
          }}>
            {p}
          </p>
        </div>
      ))}
    </div>
  )
}

function PdfViewer({
  signedUrl, title, extractedText, tPdfViewer, tPlainText, tUnavailable,
}: {
  signedUrl:     string | null
  title:         string
  extractedText: string | null
  tPdfViewer:    string
  tPlainText:    string
  tUnavailable:  string
}) {
  const [showText, setShowText] = useState(false)

  if (!signedUrl) {
    return (
      <div style={{
        padding: '40px 24px',
        background: 'var(--bg-raised)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: '12px',
        textAlign: 'center',
        color: 'var(--text-tertiary)',
        fontSize: '13px',
      }}>
        {tUnavailable}
      </div>
    )
  }

  return (
    <div>
      <div style={{
        display: 'inline-flex',
        background: 'var(--bg-raised)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '3px',
        marginBottom: '14px',
      }}>
        <ModeBtn active={!showText} onClick={() => setShowText(false)}>{tPdfViewer}</ModeBtn>
        <ModeBtn active={showText} onClick={() => setShowText(true)}>{tPlainText}</ModeBtn>
      </div>

      {showText && extractedText ? (
        <div style={{
          padding: '24px',
          background: 'var(--bg-raised)',
          border: '0.5px solid var(--border-subtle)',
          borderRadius: '12px',
          fontSize: '15px',
          lineHeight: 1.75,
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
        }}>
          {extractedText}
        </div>
      ) : (
        <iframe
          src={signedUrl}
          title={title}
          style={{
            width: '100%',
            aspectRatio: '8.5 / 11',
            maxHeight: '85dvh',
            background: 'var(--bg-raised)',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: '12px',
            display: 'block',
          }}
        />
      )}
    </div>
  )
}

function AttachmentRow({ att }: { att: Attachment }) {
  const styles: Record<typeof att.file_type, { bg: string; emoji: string }> = {
    pdf:   { bg: 'rgba(195,33,38,0.12)',  emoji: '📕' },
    image: { bg: 'rgba(68,152,204,0.12)', emoji: '🖼' },
    audio: { bg: 'rgba(245,174,65,0.12)', emoji: '🎵' },
    other: { bg: 'var(--bg-elevated)',     emoji: '📄' },
  }
  const s = styles[att.file_type]

  return (
    <a
      href={att.file_url}
      download
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        background: 'var(--bg-raised)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: '8px',
        textDecoration: 'none',
        transition: 'border-color 0.12s',
      }}
    >
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '7px',
        background: s.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '17px',
        flexShrink: 0,
      }}>
        {s.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px',
          color: 'var(--text-primary)',
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {att.file_name}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
          {att.file_type.toUpperCase()} · {formatBytes(att.size_bytes)}
        </div>
      </div>
      <DownloadIcon />
    </a>
  )
}

const breadcrumbLink: React.CSSProperties = {
  color: 'var(--text-tertiary)',
  textDecoration: 'none',
}

const actionBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  background: 'transparent',
  color: 'var(--text-primary)',
  border: '0.5px solid var(--border-strong)',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  textDecoration: 'none',
}

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '12px',
  fontFamily: 'var(--font-body)',
}

function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6"  cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49"/>
    </svg>
  )
}
function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}
function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}
