'use client'

import { useState, useRef, useEffect } from 'react'
import { createAuthor } from '@/app/admin/(dashboard)/authors/actions'
import InitialsAvatar from '@/components/reader/InitialsAvatar'

/**
 * Author picker used by both UploadForm and EditForm.
 *
 * UX:
 *   - Free-text input that filters the supplied `authors` list as the
 *     admin types.
 *   - Click a match to select it: `authorId` + `displayName` both flow
 *     back to the parent via `onChange`.
 *   - If no match exists, the dropdown shows a "+ Create '<typed name>'"
 *     row that creates a new authors row server-side, then immediately
 *     selects it. Avatars and bios can be filled in later via the
 *     /admin/authors/[id] page.
 *
 * Why we keep `displayName` on the parent and don't just store the id:
 *   Content rows write `speaker` (text) alongside `author_id`. The
 *   denormalised string is what powers the public byline when an author
 *   is deleted (FK SET NULL) — the row keeps its credited name without
 *   needing the author profile to still exist.
 */

export interface AuthorPickerOption {
  id:         string
  name:       string
  slug:       string
  avatar_url: string | null
}

interface AuthorPickerProps {
  /** All authors, fetched server-side by the parent page. */
  authors:     AuthorPickerOption[]
  /** Currently selected author id (or null = freeform text only). */
  value:       string | null
  /** Currently displayed name (denormalised). */
  displayName: string
  onChange: (next: { authorId: string | null; displayName: string }) => void
  /** Hint underneath the input. */
  hint?:    string
}

export default function AuthorPicker({
  authors, value, displayName, onChange, hint,
}: AuthorPickerProps) {
  /* Two-mode UX: when an author is selected we show a chip with the avatar
     + name + an "x" to clear. When nothing is selected we show the typeahead
     input. Switching between them is purely a render decision based on `value`. */

  const [query,       setQuery]       = useState('')
  const [open,        setOpen]        = useState(false)
  const [creating,    setCreating]    = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  /* Close the dropdown when clicking outside. */
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  /* Filter authors as the admin types. Match against name, case-insensitive. */
  const trimmedQuery = query.trim()
  const filtered = trimmedQuery
    ? authors.filter(a => a.name.toLowerCase().includes(trimmedQuery.toLowerCase()))
    : authors.slice(0, 8) // Show first 8 by default — long lists scroll inside the dropdown.

  const exactMatch = filtered.some(a => a.name.toLowerCase() === trimmedQuery.toLowerCase())
  const canCreate  = trimmedQuery.length >= 2 && !exactMatch

  const selectedAuthor = authors.find(a => a.id === value) ?? null

  function selectAuthor(author: AuthorPickerOption) {
    onChange({ authorId: author.id, displayName: author.name })
    setQuery('')
    setOpen(false)
  }

  function clearSelection() {
    onChange({ authorId: null, displayName: '' })
    setQuery('')
    setOpen(false)
  }

  async function handleCreate() {
    if (!canCreate || creating) return
    setCreating(true)
    setCreateError(null)
    try {
      const result = await createAuthor(trimmedQuery, '')
      if (!result.ok || !result.authorId) {
        setCreateError(result.error ?? 'Create failed')
        setCreating(false)
        return
      }
      /* New row exists server-side; we don't yet have its full record in
         the `authors` prop (parent fetched on page-load). Use the typed
         name as the displayName — that's what shows on the byline. The
         next render of the parent page will refresh the authors list. */
      onChange({ authorId: result.authorId, displayName: trimmedQuery })
      setQuery('')
      setOpen(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  /* SELECTED state — show chip with avatar + name + clear button. */
  if (selectedAuthor || (value === null && displayName.trim() !== '')) {
    /* Two sub-cases inside this branch:
         1. selectedAuthor present — picked from the list (has avatar).
         2. value === null but displayName has text — legacy denormalised
            string with no matching author row. Render it as a plain chip
            with initials so admins can still clear it. */
    const chipAvatarUrl = selectedAuthor?.avatar_url ?? null
    const chipName      = selectedAuthor?.name ?? displayName

    return (
      <div ref={containerRef}>
        <div style={{
          display:      'inline-flex',
          alignItems:   'center',
          gap:          '8px',
          padding:      '6px 6px 6px 8px',
          background:   'var(--bg-elevated)',
          border:       '0.5px solid var(--border-subtle)',
          borderRadius: '999rem',
          maxWidth:     '100%',
        }}>
          <InitialsAvatar name={chipName} avatarUrl={chipAvatarUrl} size={1.5} />
          <span style={{
            fontSize:     '13px',
            color:        'var(--text-primary)',
            fontFamily:   'var(--font-body)',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            {chipName}
            {!selectedAuthor && (
              <span style={{
                marginLeft: '6px',
                fontSize:   '11px',
                color:      'var(--text-tertiary)',
              }}>
                (legacy)
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={clearSelection}
            aria-label="Clear author"
            style={{
              width:        '20px',
              height:       '20px',
              borderRadius: '50%',
              border:       'none',
              background:   'transparent',
              color:        'var(--text-tertiary)',
              cursor:       'pointer',
              fontSize:     '14px',
              lineHeight:   1,
              padding:      0,
            }}
          >
            ×
          </button>
        </div>
        {hint && (
          <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {hint}
          </div>
        )}
      </div>
    )
  }

  /* SEARCH state — input + dropdown. */
  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search or create author…"
        style={{
          width:        '100%',
          padding:      '8px 11px',
          fontSize:     '14px',
          fontFamily:   'var(--font-body)',
          background:   'var(--bg-base)',
          border:       '0.5px solid var(--border-subtle)',
          borderRadius: '6px',
          color:        'var(--text-primary)',
        }}
      />
      {hint && (
        <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
          {hint}
        </div>
      )}

      {open && (filtered.length > 0 || canCreate) && (
        <div style={{
          position:     'absolute',
          top:          'calc(100% + 4px)',
          left:         0,
          right:        0,
          maxHeight:    '14rem',
          overflowY:    'auto',
          background:   'var(--bg-raised)',
          border:       '0.5px solid var(--border-subtle)',
          borderRadius: '7px',
          boxShadow:    '0 4px 12px rgba(0, 0, 0, 0.08)',
          zIndex:       10,
        }}>
          {filtered.map(author => (
            <button
              key={author.id}
              type="button"
              onClick={() => selectAuthor(author)}
              style={{
                width:      '100%',
                display:    'flex',
                alignItems: 'center',
                gap:        '10px',
                padding:    '8px 10px',
                background: 'transparent',
                border:     'none',
                borderBottom: '0.5px solid var(--border-subtle)',
                cursor:     'pointer',
                textAlign:  'left',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <InitialsAvatar name={author.name} avatarUrl={author.avatar_url} size={1.75} />
              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {author.name}
              </span>
            </button>
          ))}

          {canCreate && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              style={{
                width:       '100%',
                display:     'flex',
                alignItems:  'center',
                gap:         '8px',
                padding:     '10px',
                background:  'transparent',
                border:      'none',
                cursor:      creating ? 'wait' : 'pointer',
                textAlign:   'left',
                fontFamily:  'var(--font-body)',
                fontSize:    '13px',
                color:       'var(--brand-gold)',
                fontWeight:  500,
              }}
              onMouseEnter={e => { if (!creating) e.currentTarget.style.background = 'var(--bg-elevated)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {creating ? 'Creating…' : `+ Create “${trimmedQuery}”`}
            </button>
          )}
        </div>
      )}

      {createError && (
        <div style={{
          marginTop:  '6px',
          fontSize:   '12px',
          color:      'var(--text-danger, #B91C1C)',
          fontFamily: 'var(--font-body)',
        }}>
          {createError}
        </div>
      )}
    </div>
  )
}