'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteAuthor } from './actions'
import InitialsAvatar from '@/components/reader/InitialsAvatar'

interface AuthorRow {
  id:            string
  name:          string
  slug:          string
  bio:           string | null
  avatar_url:    string | null
  created_at:    string
  content_count: number
}

export default function AuthorsList({ authors }: { authors: AuthorRow[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [busyId,    setBusyId]    = useState<string | null>(null)

  function onDelete(id: string) {
    setError(null)
    setBusyId(id)
    startTransition(async () => {
      const result = await deleteAuthor(id)
      setBusyId(null)
      if (!result.ok) {
        setError(result.error ?? 'Delete failed')
        return
      }
      setConfirmId(null)
      router.refresh()
    })
  }

  if (authors.length === 0) {
    return (
      <div style={{
        padding:      '40px 16px',
        textAlign:    'center',
        background:   'var(--bg-raised)',
        border:       '0.5px solid var(--border-subtle)',
        borderRadius: '8px',
        color:        'var(--text-tertiary)',
        fontSize:     '14px',
      }}>
        No authors yet. Create one to get started.
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div style={{
          padding:      '10px 12px',
          marginBottom: '16px',
          background:   'var(--bg-danger-soft, #FDE8E8)',
          border:       '0.5px solid var(--border-danger, #F5A3A3)',
          borderRadius: '7px',
          color:        'var(--text-danger, #B91C1C)',
          fontSize:     '13px',
        }}>
          {error}
        </div>
      )}

      <div style={{
        background:   'var(--bg-raised)',
        border:       '0.5px solid var(--border-subtle)',
        borderRadius: '8px',
        overflow:     'hidden',
      }}>
        {authors.map((author, idx) => {
          const isLast = idx === authors.length - 1
          return (
            <div
              key={author.id}
              style={{
                display:    'grid',
                gridTemplateColumns: 'auto 1fr auto auto',
                gap:        '14px',
                alignItems: 'center',
                padding:    '14px 16px',
                borderBottom: isLast ? 'none' : '0.5px solid var(--border-subtle)',
              }}
            >
              <InitialsAvatar
                name={author.name}
                avatarUrl={author.avatar_url}
                size={2.5}
              />

              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize:      '14px',
                  fontWeight:    500,
                  color:         'var(--text-primary)',
                  fontFamily:    'var(--font-body)',
                  overflow:      'hidden',
                  textOverflow:  'ellipsis',
                  whiteSpace:    'nowrap',
                }}>
                  {author.name}
                </div>
                <div style={{
                  fontSize:   '12px',
                  color:      'var(--text-tertiary)',
                  marginTop:  '2px',
                  fontFamily: 'var(--font-body)',
                }}>
                  /{author.slug} · {author.content_count} {author.content_count === 1 ? 'item' : 'items'}
                </div>
              </div>

              <Link
                href={`/admin/authors/${author.id}`}
                style={{
                  fontSize:       '13px',
                  color:          'var(--text-secondary)',
                  textDecoration: 'none',
                  padding:        '6px 10px',
                  borderRadius:   '6px',
                  border:         '0.5px solid var(--border-subtle)',
                  fontFamily:     'var(--font-body)',
                }}
              >
                Edit
              </Link>

              {confirmId === author.id ? (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => onDelete(author.id)}
                    disabled={busyId === author.id}
                    style={{
                      fontSize:    '12px',
                      color:       '#FFFFFF',
                      background:  'var(--text-danger, #B91C1C)',
                      border:      'none',
                      padding:     '6px 10px',
                      borderRadius: '6px',
                      cursor:      busyId === author.id ? 'wait' : 'pointer',
                      fontFamily:  'var(--font-body)',
                    }}
                  >
                    {busyId === author.id ? 'Deleting…' : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    style={{
                      fontSize:    '12px',
                      color:       'var(--text-tertiary)',
                      background:  'transparent',
                      border:      '0.5px solid var(--border-subtle)',
                      padding:     '6px 10px',
                      borderRadius: '6px',
                      cursor:      'pointer',
                      fontFamily:  'var(--font-body)',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(author.id)}
                  style={{
                    fontSize:    '13px',
                    color:       'var(--text-tertiary)',
                    background:  'transparent',
                    border:      '0.5px solid var(--border-subtle)',
                    padding:     '6px 10px',
                    borderRadius: '6px',
                    cursor:      'pointer',
                    fontFamily:  'var(--font-body)',
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}