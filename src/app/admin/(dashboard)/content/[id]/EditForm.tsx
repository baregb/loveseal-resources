'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import RichEditor from '@/components/editor/RichEditor'
import AttachmentsPanel, { type PendingAttachment, uploadAttachments } from '@/components/editor/AttachmentsPanel'
import type { ContentType, Locale } from '@/types'
import { logContentUpdated } from '../actions'
import { translateContent } from '../translate-actions'

interface Item {
  id: string; title: string; content_type: ContentType
  source_mode: 'pdf' | 'editor'
  category: string; tags: string[]
  theme: string | null; lesson_number: string | null; speaker: string | null
  series: string | null; date_preached: string | null; scripture_refs: string[]
  summary_points: string[] | null; language: Locale; status: 'draft' | 'published'
  body_html: string | null
  pdf_url: string | null
}

interface AttachmentRow {
  id: string
  file_url: string
  file_name: string
  file_type: 'pdf' | 'image' | 'audio' | 'other'
  mime_type: string
  size_bytes: number
}

interface Category { id: string; name: string; slug: string; content_type: string | null }

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'manual', label: 'Manual' }, { value: 'prophecy', label: 'Prophecy' },
  { value: 'article', label: 'Article' }, { value: 'blog', label: 'Blog' },
]

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' }, { value: 'pt', label: 'Portuguese' },
  { value: 'ar', label: 'Arabic' },
]

const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English', es: 'Spanish', fr: 'French', pt: 'Portuguese', ar: 'Arabic',
}

export default function EditForm({
  item, categories, existingAttachments,
}: {
  item: Item
  categories: Category[]
  existingAttachments: AttachmentRow[]
}) {
  const router = useRouter()

  const [title, setTitle]               = useState(item.title)
  const [contentType, setContentType]   = useState<ContentType>(item.content_type)
  const [language, setLanguage]         = useState<Locale>(item.language)
  const [bodyHtml, setBodyHtml]         = useState(item.body_html ?? '')
  const [theme, setTheme]               = useState(item.theme ?? '')
  const [series, setSeries]             = useState(item.series ?? '')
  const [lessonNumber, setLessonNumber] = useState(item.lesson_number ?? '')
  const [speaker, setSpeaker]           = useState(item.speaker ?? '')
  const [datePreached, setDatePreached] = useState(item.date_preached ?? '')
  const [category, setCategory]         = useState(item.category)
  const [tags, setTags]                 = useState(item.tags.join(', '))
  const [scriptureRefs, setScriptureRefs] = useState(item.scripture_refs.join('; '))
  const [summaryPoints, setSummaryPoints] = useState((item.summary_points ?? []).join('\n'))
  const [status, setStatus]             = useState<'draft' | 'published'>(item.status)

  // Attachments — convert existing rows to PendingAttachment format
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])

  useEffect(() => {
    setAttachments(existingAttachments.map(a => ({
      id:          a.id,
      db_id:       a.id,
      file:        new File([], a.file_name),  // dummy, never uploaded
      file_name:   a.file_name,
      file_type:   a.file_type,
      mime_type:   a.mime_type,
      size_bytes:  a.size_bytes,
      preview_url: a.file_url,
      stored_url:  a.file_url,
    })))
  }, [existingAttachments])

  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)

  // ── Translation state ──
  const [translating, setTranslating]         = useState(false)
  const [translateMsg, setTranslateMsg]       = useState<string | null>(null)
  const [translateError, setTranslateError]   = useState<string | null>(null)

  const filteredCategories = categories.filter(
    c => c.content_type === null || c.content_type === contentType
  )

  // PDF mode is locked — can't switch source mode after creation
  const isEditorMode = item.source_mode === 'editor'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setSaved(false); setError(null)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase.from('content').update({
        title: title.trim(),
        content_type: contentType,
        category: category || '',
        language,
        theme:         theme.trim() || null,
        lesson_number: lessonNumber.trim() || null,
        speaker:       speaker.trim() || null,
        series:        series.trim() || null,
        date_preached: datePreached || null,
        scripture_refs: scriptureRefs.split(';').map(s => s.trim()).filter(Boolean),
        tags:          tags.split(',').map(t => t.trim()).filter(Boolean),
        body_html:     isEditorMode ? bodyHtml : null,
        summary_points: summaryPoints.split('\n').map(s => s.trim()).filter(Boolean).length
                          ? summaryPoints.split('\n').map(s => s.trim()).filter(Boolean) : null,
        status,
      } as never).eq('id', item.id)

      if (updateError) throw new Error(updateError.message)
      await logContentUpdated(item.id, title.trim())

      // Upload any new attachments
      const newAttachments = attachments.filter(a => !a.db_id)
      if (newAttachments.length > 0) {
        await uploadAttachments(item.id, attachments)
      }

      setSaved(true); setSaving(false); router.refresh()
      setTimeout(() => setSaved(false), 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  async function handleTranslate() {
    setTranslating(true)
    setTranslateMsg(null)
    setTranslateError(null)

    try {
      const result = await translateContent(item.id)

      if (!result.ok) {
        setTranslateError(result.error ?? 'Translation failed')
        return
      }

      const okList = (result.succeeded ?? []).map(l => LOCALE_LABEL[l]).join(', ')
      const failCount = result.failed?.length ?? 0

      if (failCount === 0) {
        setTranslateMsg(`Translated to ${okList}.`)
      } else {
        setTranslateMsg(`Translated to ${okList}. ${failCount} locale(s) failed.`)
      }

      router.refresh()
      setTimeout(() => setTranslateMsg(null), 5000)
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : 'Translation failed')
    } finally {
      setTranslating(false)
    }
  }

  const canTranslate = isEditorMode
    ? Boolean(bodyHtml.trim())
    : true  // PDF content has extracted_text — server handles emptiness

  return (
    <form onSubmit={handleSave}>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'sticky', top: '72px' }}>

          <div style={cardStyle}>
            <SectionHeader label="ATTACHMENTS" />
            <AttachmentsPanel attachments={attachments} onChange={setAttachments} />
          </div>

          <div style={cardStyle}>
            <SectionHeader label="STATUS" />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {(['draft', 'published'] as const).map(s => (
                <button key={s} type="button" onClick={() => setStatus(s)} style={{
                  flex: 1, padding: '8px',
                  background: status === s ? 'var(--brand-gold)' : 'transparent',
                  color: status === s ? 'var(--text-inverse)' : 'var(--text-tertiary)',
                  border: `0.5px solid ${status === s ? 'var(--brand-gold)' : 'var(--border-strong)'}`,
                  borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  textTransform: 'capitalize', fontFamily: 'var(--font-body)',
                }}>{s}</button>
              ))}
            </div>

            {error && (
              <div style={{
                padding: '10px 12px', background: 'var(--danger-bg)',
                border: '0.5px solid var(--danger-border)', borderRadius: '6px',
                fontSize: '12px', color: 'var(--danger-fg)', marginBottom: '12px',
              }}>{error}</div>
            )}

            {saved && (
              <div style={{
                padding: '10px 12px', background: 'var(--success-bg)',
                border: '0.5px solid rgba(76,175,80,0.25)', borderRadius: '6px',
                fontSize: '12px', color: 'var(--success-fg)', marginBottom: '12px',
              }}>Saved ✓</div>
            )}

            <button type="submit" disabled={saving} style={{
              width: '100%', padding: '11px',
              background: saving ? 'var(--bg-elevated)' : 'var(--brand-gold)',
              color: saving ? 'var(--text-muted)' : 'var(--text-inverse)',
              border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
            }}>{saving ? 'Saving…' : 'Save changes'}</button>
          </div>

          {/* Translation card */}
          <div style={cardStyle}>
            <SectionHeader label="TRANSLATIONS" hint="auto via MS Translator" />

            <p style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              lineHeight: 1.55,
              marginBottom: '12px',
            }}>
              Source language is <strong style={{ color: 'var(--text-secondary)' }}>{LOCALE_LABEL[language]}</strong>.
              {' '}Translates into the other 4 locales.
            </p>

            {translateError && (
              <div style={{
                padding: '10px 12px', background: 'var(--danger-bg)',
                border: '0.5px solid var(--danger-border)', borderRadius: '6px',
                fontSize: '11px', color: 'var(--danger-fg)', marginBottom: '12px',
                lineHeight: 1.4,
              }}>{translateError}</div>
            )}

            {translateMsg && (
              <div style={{
                padding: '10px 12px', background: 'var(--success-bg)',
                border: '0.5px solid rgba(76,175,80,0.25)', borderRadius: '6px',
                fontSize: '11px', color: 'var(--success-fg)', marginBottom: '12px',
                lineHeight: 1.4,
              }}>{translateMsg}</div>
            )}

            <button
              type="button"
              onClick={handleTranslate}
              disabled={translating || !canTranslate}
              style={{
                width: '100%',
                padding: '10px',
                background: translating ? 'var(--bg-elevated)' : 'transparent',
                color: translating ? 'var(--text-muted)' : 'var(--text-primary)',
                border: '0.5px solid var(--border-strong)',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: (translating || !canTranslate) ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)',
                opacity: !canTranslate ? 0.5 : 1,
              }}
            >
              {translating ? 'Translating…' : 'Translate to all locales'}
            </button>
            {!canTranslate && (
              <p style={{
                fontSize: '10px',
                color: 'var(--text-faint)',
                marginTop: '8px',
                fontStyle: 'italic',
              }}>
                Add content body first.
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <div style={cardStyle}>
            <SectionHeader label="IDENTITY" />
            <Field label="Title" required>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Field label="Content type" required>
                <select value={contentType} onChange={e => { setContentType(e.target.value as ContentType); setCategory('') }} style={inputStyle}>
                  {CONTENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Language">
                <select value={language} onChange={e => setLanguage(e.target.value as Locale)} style={inputStyle}>
                  {LOCALES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Body */}
          <div style={cardStyle}>
            <SectionHeader
              label="CONTENT BODY"
              hint={isEditorMode ? 'rich editor' : 'PDF — managed at upload time'}
            />
            {isEditorMode ? (
              <RichEditor
                initialHtml={bodyHtml}
                onChange={setBodyHtml}
                placeholder="Continue editing… type / for blocks"
              />
            ) : (
              <div style={{
                padding: '20px',
                background: 'var(--bg-elevated)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-tertiary)',
                lineHeight: 1.6,
              }}>
                This Manual was uploaded as a PDF. The PDF cannot be replaced from this screen — to change it,
                delete this item and upload a new one.
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <SectionHeader label="TEACHING DETAILS" hint="optional" />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <Field label="Theme">
                <input type="text" value={theme} onChange={e => setTheme(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Lesson #">
                <input type="text" value={lessonNumber} onChange={e => setLessonNumber(e.target.value)} style={inputStyle} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <Field label="Series">
                <input type="text" value={series} onChange={e => setSeries(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Date preached">
                <input type="date" value={datePreached} onChange={e => setDatePreached(e.target.value)} style={inputStyle} />
              </Field>
            </div>
            <Field label="Speaker">
              <input type="text" value={speaker} onChange={e => setSpeaker(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <div style={cardStyle}>
            <SectionHeader label="CATEGORISATION" />
            <Field label="Category">
              <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                <option value="">— No category —</option>
                {filteredCategories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Tags" hint="comma separated">
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Scripture references" hint="separate with semicolons">
              <input type="text" value={scriptureRefs} onChange={e => setScriptureRefs(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <div style={cardStyle}>
            <SectionHeader label="KEY POINTS" hint="one per line" />
            <textarea value={summaryPoints} onChange={e => setSummaryPoints(e.target.value)} rows={6}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>
        </div>
      </div>
    </form>
  )
}

function SectionHeader({ label, hint, required }: { label: string; hint?: string; required?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      marginBottom: '14px', paddingBottom: '8px', borderBottom: '0.5px solid var(--border-subtle)',
    }}>
      <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.14em', color: 'var(--text-muted)' }}>
        {label}{required && <span style={{ color: 'var(--brand-gold)', marginLeft: '4px' }}>*</span>}
      </span>
      {hint && <span style={{ fontSize: '10px', color: 'var(--text-faint)', fontStyle: 'italic' }}>{hint}</span>}
    </div>
  )
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>
          {label}{required && <span style={{ color: 'var(--brand-gold)', marginLeft: '3px' }}>*</span>}
        </label>
        {hint && <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-raised)',
  border: '0.5px solid var(--border-subtle)',
  borderRadius: '10px',
  padding: '18px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px',
  background: 'var(--bg-input)', border: '0.5px solid var(--border-strong)',
  borderRadius: '6px', color: 'var(--text-primary)',
  fontSize: '13px', fontFamily: 'var(--font-body)', outline: 'none',
}