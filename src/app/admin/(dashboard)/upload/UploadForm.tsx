'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { extractTextFromPDF } from '@/lib/pdf'
import RichEditor from '@/components/editor/RichEditor'
import AttachmentsPanel, { type PendingAttachment, uploadAttachments } from '@/components/editor/AttachmentsPanel'
import type { ContentType, Locale } from '@/types'
import { logContentCreated } from '../content/actions'

interface Category {
  id: string
  name: string
  slug: string
  content_type: string | null
}

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'manual', label: 'Manual' }, { value: 'prophecy', label: 'Prophecy' },
  { value: 'article', label: 'Article' }, { value: 'blog', label: 'Blog' },
]

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' }, { value: 'pt', label: 'Portuguese' },
  { value: 'ar', label: 'Arabic' },
]

type SourceMode = 'pdf' | 'editor'

export default function UploadForm({ categories }: { categories: Category[] }) {
  const pdfRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLInputElement>(null)
  const [title, setTitle]               = useState('')
  const [contentType, setContentType]   = useState<ContentType>('manual')
  const [language, setLanguage]         = useState<Locale>('en')
  const [sourceMode, setSourceMode]     = useState<SourceMode>('editor')
  const [bodyHtml, setBodyHtml]         = useState('')
  const [pdfFile, setPdfFile]           = useState<File | null>(null)
  const [coverFile, setCoverFile]       = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [attachments, setAttachments]   = useState<PendingAttachment[]>([])
  const [theme, setTheme]               = useState('')
  const [series, setSeries]             = useState('')
  const [lessonNumber, setLessonNumber] = useState('')
  const [speaker, setSpeaker]           = useState('')
  const [datePreached, setDatePreached] = useState('')
  const [category, setCategory]         = useState('')
  const [tags, setTags]                 = useState('')
  const [scriptureRefs, setScriptureRefs] = useState('')
  const [summaryPoints, setSummaryPoints] = useState('')
  const [status, setStatus]             = useState<'draft' | 'published'>('draft')
  const [loading, setLoading]   = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError]       = useState<string | null>(null)

  const filteredCategories = categories.filter(
    c => c.content_type === null || c.content_type === contentType
  )

  // For non-manual types, always force editor mode
  const isManual    = contentType === 'manual'
  const effectiveMode: SourceMode = isManual ? sourceMode : 'editor'

  function handleContentTypeChange(next: ContentType) {
    setContentType(next)
    setCategory('')
    if (next !== 'manual') setSourceMode('editor')
  }

  function handlePDFChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { setError('Only PDF files are allowed.'); return }
    if (file.size > 52428800) { setError('PDF must be under 50 MB.'); return }
    setPdfFile(file)
    setError(null)
    if (!title) setTitle(file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '))
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required.'); return }

    if (effectiveMode === 'pdf' && !pdfFile) {
      setError('Please select a PDF file.'); return
    }
    if (effectiveMode === 'editor' && !bodyHtml.trim()) {
      setError('Please write some content in the editor.'); return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      let pdfPath:        string | null = null
      let extractedText:  string | null = null

      if (effectiveMode === 'pdf' && pdfFile) {
        setProgress('Extracting text from PDF…')
        extractedText = await extractTextFromPDF(pdfFile)

        setProgress('Uploading PDF…')
        pdfPath = `${Date.now()}-${pdfFile.name.replace(/\s+/g, '-')}`
        const { error: pdfError } = await supabase.storage
          .from('content-pdfs')
          .upload(pdfPath, pdfFile, { contentType: 'application/pdf' })
        if (pdfError) throw new Error(`PDF upload failed: ${pdfError.message}`)
      }

      let coverImageUrl: string | null = null
      if (coverFile) {
        setProgress('Uploading cover image…')
        const coverPath = `${Date.now()}-${coverFile.name.replace(/\s+/g, '-')}`
        const { error: coverError } = await supabase.storage
          .from('cover-images')
          .upload(coverPath, coverFile, { contentType: coverFile.type })
        if (coverError) throw new Error(`Cover upload failed: ${coverError.message}`)
        const { data: { publicUrl } } = supabase.storage.from('cover-images').getPublicUrl(coverPath)
        coverImageUrl = publicUrl
      }

      setProgress('Saving…')
      const { data: inserted, error: dbError } = await (supabase
        .from('content')
        .insert({
          title:           title.trim(),
          content_type:    contentType,
          source_mode:     effectiveMode,
          category:        category || '',
          language,
          theme:           theme.trim() || null,
          lesson_number:   lessonNumber.trim() || null,
          speaker:         speaker.trim() || null,
          series:          series.trim() || null,
          date_preached:   datePreached || null,
          scripture_refs:  scriptureRefs.split(';').map(s => s.trim()).filter(Boolean),
          tags:            tags.split(',').map(t => t.trim()).filter(Boolean),
          extracted_text:  extractedText,
          body_html:       effectiveMode === 'editor' ? bodyHtml : null,
          summary_points:  summaryPoints.split('\n').map(s => s.trim()).filter(Boolean).length
                            ? summaryPoints.split('\n').map(s => s.trim()).filter(Boolean) : null,
          pdf_url:         pdfPath,
          cover_image_url: coverImageUrl,
          status,
        } as never)
        .select('id')
        .single()) as { data: { id: string } | null; error: { message: string } | null }

      if (dbError || !inserted) throw new Error(`Save failed: ${dbError?.message ?? 'unknown error'}`)

      // Upload attachments after content row is created
      if (attachments.length > 0) {
        setProgress('Uploading attachments…')
        await uploadAttachments(inserted.id, attachments)
      }

      await logContentCreated(inserted.id, title.trim(), contentType, status)
 
      /* Fire-and-forget translation. We don't await it because translating into
         4 locales can take 5-15s and we don't want to block the redirect. The
         endpoint logs its own audit row on completion. */
      fetch('/api/translate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ contentId: inserted.id }),
        keepalive: true,
      }).catch(() => { /* silent — admins can retry from the edit screen */ })
 
      window.location.href = '/admin/content'

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(false)
      setProgress('')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* ──── LEFT — Sidebar ──── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'sticky', top: '72px' }}>

          {/* Cover */}
          <div style={cardStyle}>
            <SectionHeader label="COVER IMAGE" hint="optional" />
            <div onClick={() => imgRef.current?.click()} style={{
              border: `1.5px dashed ${coverFile ? 'var(--brand-blue)' : 'var(--border-strong)'}`,
              borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
              minHeight: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob: URL from URL.createObjectURL, can't be optimized by next/image
                <img src={coverPreview} alt="" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>🖼</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Add cover</p>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Max 5 MB</p>
                </div>
              )}
            </div>
            <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverChange} style={{ display: 'none' }} />
          </div>

          {/* Attachments */}
          <div style={cardStyle}>
            <SectionHeader label="ATTACHMENTS" hint="optional" />
            <AttachmentsPanel attachments={attachments} onChange={setAttachments} />
          </div>

          {/* Publishing */}
          <div style={cardStyle}>
            <SectionHeader label="PUBLISHING" />
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
                fontSize: '12px', color: 'var(--danger-fg)', marginBottom: '12px', lineHeight: 1.5,
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px',
              background: loading ? 'var(--bg-elevated)' : 'var(--brand-gold)',
              color: loading ? 'var(--text-muted)' : 'var(--text-inverse)',
              border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
            }}>{loading ? progress || 'Uploading…' : 'Save content'}</button>
          </div>
        </div>

        {/* ──── RIGHT — Main content ──── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Identity */}
          <div style={cardStyle}>
            <SectionHeader label="IDENTITY" />
            <Field label="Title" required>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Becoming a Disciple Indeed" required style={inputStyle} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Field label="Content type" required>
                <select value={contentType} onChange={e => handleContentTypeChange(e.target.value as ContentType)} style={inputStyle}>
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

          {/* Body — Mode toggle for Manuals, editor or PDF */}
          <div style={cardStyle}>
            <SectionHeader
              label="CONTENT BODY"
              required
              hint={isManual ? 'choose mode' : 'rich editor'}
            />

            {isManual && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                {(['editor', 'pdf'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSourceMode(m)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: sourceMode === m ? 'var(--brand-gold)' : 'transparent',
                      color: sourceMode === m ? 'var(--text-inverse)' : 'var(--text-tertiary)',
                      border: `0.5px solid ${sourceMode === m ? 'var(--brand-gold)' : 'var(--border-strong)'}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {m === 'editor' ? '✎  Rich Editor' : '📄  PDF Upload'}
                  </button>
                ))}
              </div>
            )}

            {effectiveMode === 'pdf' ? (
              <div onClick={() => pdfRef.current?.click()} style={{
                border: `1.5px dashed ${pdfFile ? 'var(--brand-gold)' : 'var(--border-strong)'}`,
                borderRadius: '8px', padding: '32px 16px', textAlign: 'center', cursor: 'pointer',
              }}>
                {pdfFile ? (
                  <>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
                    <p style={{ fontSize: '13px', color: 'var(--brand-gold)', fontWeight: 500, wordBreak: 'break-all' }}>{pdfFile.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB · click to change
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📎</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Click to select PDF</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Max 50 MB</p>
                  </>
                )}
                <input ref={pdfRef} type="file" accept="application/pdf" onChange={handlePDFChange} style={{ display: 'none' }} />
              </div>
            ) : (
              <RichEditor
                onChange={setBodyHtml}
                placeholder="Start writing… type / for blocks, or use the toolbar above"
              />
            )}
          </div>

          {/* Teaching */}
          <div style={cardStyle}>
            <SectionHeader label="TEACHING DETAILS" hint="optional" />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <Field label="Theme">
                <input type="text" value={theme} onChange={e => setTheme(e.target.value)} placeholder="e.g. Discipleship" style={inputStyle} />
              </Field>
              <Field label="Lesson #">
                <input type="text" value={lessonNumber} onChange={e => setLessonNumber(e.target.value)} placeholder="e.g. Four" style={inputStyle} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <Field label="Series">
                <input type="text" value={series} onChange={e => setSeries(e.target.value)} placeholder="e.g. God's Process" style={inputStyle} />
              </Field>
              <Field label="Date preached">
                <input type="date" value={datePreached} onChange={e => setDatePreached(e.target.value)} style={inputStyle} />
              </Field>
            </div>
            <Field label="Speaker">
              <input type="text" value={speaker} onChange={e => setSpeaker(e.target.value)} placeholder="e.g. Pastor John" style={inputStyle} />
            </Field>
          </div>

          {/* Categorisation */}
          <div style={cardStyle}>
            <SectionHeader label="CATEGORISATION" />
            <Field label="Category">
              <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                <option value="">— No category —</option>
                {filteredCategories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Tags" hint="comma separated">
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. faith, surrender" style={inputStyle} />
            </Field>
            <Field label="Scripture references" hint="separate with semicolons">
              <input type="text" value={scriptureRefs} onChange={e => setScriptureRefs(e.target.value)} placeholder="e.g. Matthew 16:24; John 8:31-32" style={inputStyle} />
            </Field>
          </div>

          {/* Summary */}
          <div style={cardStyle}>
            <SectionHeader label="KEY POINTS" hint="one per line · shown in summary view" />
            <textarea value={summaryPoints} onChange={e => setSummaryPoints(e.target.value)}
              placeholder={"Hundredfold Return — multiplied blessings\nEverlasting Life — eternal reward"}
              rows={5}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, fontFamily: 'var(--font-body)' }} />
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
