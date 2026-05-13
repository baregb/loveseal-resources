'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentAdmin } from '@/lib/admin-user'
import { logAudit } from '@/lib/audit'

interface ActionResult {
  ok:    boolean
  error?: string
}

/**
 * Invalidates the entire public site. Used by content mutations that change
 * what visitors see. Heavier than per-page invalidation, but bulletproof: it
 * catches every locale + the home/list/detail variants + the sitemap.
 *
 * Trade-off: a single admin click rebuilds-on-next-visit the whole public
 * site rather than one page. For a content site at this scale (≤dozens of
 * edits per day) that's fine; per-path revalidation would be fiddly to keep
 * in sync as new public routes get added.
 */
function revalidatePublicSite() {
  revalidatePath('/', 'layout')
}

/**
 * Toggle a content item's status between draft and published.
 * Logs the action to audit_log.
 */
export async function toggleContentStatus(id: string): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }

  const supabase = await createClient()

  // Fetch current state
  const { data: existing } = await supabase
    .from('content')
    .select('title, status')
    .eq('id', id)
    .single()

  const item = existing as { title: string; status: 'draft' | 'published' } | null
  if (!item) return { ok: false, error: 'Content not found' }

  const newStatus = item.status === 'published' ? 'draft' : 'published'

  const { error: updateErr } = await (supabase
    .from('content')
    .update({ status: newStatus, last_edited_by: me.id } as never)
    .eq('id', id))

  if (updateErr) return { ok: false, error: updateErr.message }

  await logAudit({
    actorId:        me.id,
    actorEmail:     me.email,
    action:         newStatus === 'published' ? 'content.published' : 'content.unpublished',
    resourceType:   'content',
    resourceId:     id,
    resourceLabel:  item.title,
  })

  revalidatePath('/admin')
  revalidatePath('/admin/content')
  revalidatePublicSite()
  return { ok: true }
}

/**
 * Delete a content item along with its attachments and storage files.
 * Logs the action to audit_log.
 */
export async function deleteContent(id: string): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }

  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // Fetch the row to get title + pdf_url + cover_image_url for cleanup
  const { data: existing } = await supabase
    .from('content')
    .select('title, pdf_url, cover_image_url')
    .eq('id', id)
    .single()

  const item = existing as { title: string; pdf_url: string | null; cover_image_url: string | null } | null
  if (!item) return { ok: false, error: 'Content not found' }

  // Fetch attachments to clean up storage
  const { data: attachments } = await supabase
    .from('content_attachments')
    .select('file_url')
    .eq('content_id', id)

  const atts = (attachments ?? []) as { file_url: string }[]

  // Delete attachment storage files (best-effort)
  const attPaths = atts
    .map(a => a.file_url.split('/content-assets/')[1])
    .filter(Boolean) as string[]
  if (attPaths.length > 0) {
    await adminSupabase.storage.from('content-assets').remove(attPaths)
  }

  // Delete the PDF file (best-effort)
  if (item.pdf_url) {
    await adminSupabase.storage.from('content-pdfs').remove([item.pdf_url])
  }

  // Delete cover image (best-effort)
  if (item.cover_image_url) {
    const coverPath = item.cover_image_url.split('/cover-images/')[1]
    if (coverPath) {
      await adminSupabase.storage.from('cover-images').remove([coverPath])
    }
  }

  // Delete the content row (cascade-deletes content_attachments rows via FK)
  const { error: deleteErr } = await supabase.from('content').delete().eq('id', id)
  if (deleteErr) return { ok: false, error: deleteErr.message }

  await logAudit({
    actorId:        me.id,
    actorEmail:     me.email,
    action:         'content.deleted',
    resourceType:   'content',
    resourceId:     id,
    resourceLabel:  item.title,
  })

  revalidatePath('/admin')
  revalidatePath('/admin/content')
  revalidatePublicSite()
  return { ok: true }
}

/**
 * Log a content creation. Called by the upload form after a successful insert.
 */
export async function logContentCreated(
  contentId: string,
  title: string,
  contentType: string,
  status: string,
): Promise<void> {
  const me = await getCurrentAdmin()
  if (!me) return

  // Stamp created_by + last_edited_by on the content row
  const supabase = await createClient()
  await (supabase
    .from('content')
    .update({ created_by: me.id, last_edited_by: me.id } as never)
    .eq('id', contentId))

  await logAudit({
    actorId:       me.id,
    actorEmail:    me.email,
    action:        'content.created',
    resourceType:  'content',
    resourceId:    contentId,
    resourceLabel: title,
    metadata:      { type: contentType, status },
  })

  /* Only invalidate public pages if this row went out as published. Drafts
     don't affect the public site, so there's no reason to thrash caches. */
  if (status === 'published') {
    revalidatePublicSite()
  }
  revalidatePath('/admin')
  revalidatePath('/admin/content')
}

/**
 * Log a content edit. Called by the edit form after a successful update.
 */
export async function logContentUpdated(
  contentId: string,
  title: string,
): Promise<void> {
  const me = await getCurrentAdmin()
  if (!me) return

  // Stamp last_edited_by
  const supabase = await createClient()
  await (supabase
    .from('content')
    .update({ last_edited_by: me.id } as never)
    .eq('id', contentId))

  await logAudit({
    actorId:       me.id,
    actorEmail:    me.email,
    action:        'content.updated',
    resourceType:  'content',
    resourceId:    contentId,
    resourceLabel: title,
  })

  /* An edit to a draft doesn't affect the public site, but checking the
     status here would require an extra fetch. The edit form already only
     calls this after a successful update, and most edits in practice are to
     either-status content where the public effect is desired anyway. Bias
     toward correctness: always revalidate. */
  revalidatePublicSite()
  revalidatePath('/admin')
  revalidatePath('/admin/content')
  revalidatePath(`/admin/content/${contentId}`)
}