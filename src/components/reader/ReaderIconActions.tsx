'use client'

import { useState } from 'react'

/**
 * Small circular icon-button row for share / copy-link / (PDF) download.
 *
 * Sits on its own row below the byline (per Pass 4 Q9: "let it be under the
 * read-time on its own row").  Replaces the old text-button action bar that
 * used to be at the same position with `Share | Copy link | Download PDF`
 * pills — those are gone.
 *
 * Buttons render as ~2.5rem circles with the brand foreground over a soft
 * neutral background, matching the design's bottom-right pair.
 *
 * Download button only renders when `downloadUrl` is provided (PDF mode
 * with a signed URL).
 */
export default function ReaderIconActions({
  shareTitle,
  copyLinkLabel,
  copiedLabel,
  shareLabel,
  downloadLabel,
  downloadUrl,
}: {
  /** Used as the `title` field on navigator.share. */
  shareTitle:    string
  copyLinkLabel: string
  copiedLabel:   string
  shareLabel:    string
  downloadLabel: string
  /** When present, renders a third (download) button as an <a download>. */
  downloadUrl:   string | null
}) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (typeof window === 'undefined') return
    const url = window.location.href
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: shareTitle, url })
        return
      } catch {
        /* user cancelled — fall through to clipboard */
      }
    }
    await handleCopyLink()
  }

  async function handleCopyLink() {
    if (typeof window === 'undefined') return
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Last-resort fallback: surface the URL so the user can copy manually.
      alert(url)
    }
  }

  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '0.5rem',
        marginBottom:   '1.5rem',
      }}
    >
      <IconButton
        onClick={handleCopyLink}
        ariaLabel={copied ? copiedLabel : copyLinkLabel}
        title={copied ? copiedLabel : copyLinkLabel}
      >
        {copied ? <CheckIcon /> : <LinkIcon />}
      </IconButton>

      <IconButton
        onClick={handleShare}
        ariaLabel={shareLabel}
        title={shareLabel}
      >
        <ShareIcon />
      </IconButton>

      {downloadUrl && (
        <IconButtonAnchor
          href={downloadUrl}
          ariaLabel={downloadLabel}
          title={downloadLabel}
        >
          <DownloadIcon />
        </IconButtonAnchor>
      )}
    </div>
  )
}

/* ── Subcomponents ──────────────────────────────────────────────────── */

function IconButton({
  onClick,
  ariaLabel,
  title,
  children,
}: {
  onClick:   () => void
  ariaLabel: string
  title:     string
  children:  React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      style={iconButtonStyle}
    >
      {children}
    </button>
  )
}

function IconButtonAnchor({
  href,
  ariaLabel,
  title,
  children,
}: {
  href:      string
  ariaLabel: string
  title:     string
  children:  React.ReactNode
}) {
  return (
    <a
      href={href}
      download
      aria-label={ariaLabel}
      title={title}
      style={{ ...iconButtonStyle, textDecoration: 'none' }}
    >
      {children}
    </a>
  )
}

const iconButtonStyle: React.CSSProperties = {
  display:        'inline-flex',
  alignItems:     'center',
  justifyContent: 'center',
  width:          '2.5rem',
  height:         '2.5rem',
  borderRadius:   '50%',
  background:     'var(--bg-raised)',
  color:          'var(--text-primary)',
  border:         '0.03125rem solid var(--border-subtle)',
  cursor:         'pointer',
  fontFamily:     'var(--font-body)',
  transition:     'background-color 0.12s, transform 0.08s',
  flexShrink:     0,
}

/* ── Icons (16x16 stroke set) ───────────────────────────────────────── */

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6"  cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49"/>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}