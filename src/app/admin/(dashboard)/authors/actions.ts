'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/admin-user'
import { logAudit } from '@/lib/audit'
import { slugifyAuthorName } from '@/lib/slugify'

interface ActionResult {
  ok:    boolean
  error?: string
  /** Returned by createAuthor so the picker can immediately select the new row. */
  authorId?: string
  slug?:     string
}

/**
 * Disambiguate slug collisions. If the base slug is taken, suffix -2, -3
 * etc. until we find a free one. Caller passes an optional `excludeId`
 * when updating, so the row's own slug doesn't count as a collision.
 */
async function uniquifySlug(
  base:       string,
  excludeId?: string,
): Promise<string> {
  const supabase = await createClient()

  let candidate = base
  let suffix    = 2
  // Cap at 100 to avoid runaway loops. Wildly unlikely in practice.
  for (let i = 0; i < 100; i++) {
    let q = supabase.from('authors').select('id').eq('slug', candidate)
    if (excludeId) q = q.neq('id', excludeId)
    const { data } = await q.maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${suffix}`
    suffix += 1
  }
  // Failsafe: append a timestamp. Should never trigger.
  return `${base}-${Date.now()}`
}

export async function createAuthor(
  name: string,
  bio:  string,
): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }
  if (!name.trim()) return { ok: false, error: 'Name is required' }

  const supabase = await createClient()
  const baseSlug = slugifyAuthorName(name)
  if (!baseSlug) return { ok: false, error: 'Could not generate a slug for that name' }

  const slug = await uniquifySlug(baseSlug)

  const { data: inserted, error } = await (supabase
    .from('authors')
    .insert({
      name: name.trim(),
      slug,
      bio:  bio.trim() || null,
    } as never)
    .select('id, slug')
    .single()) as { data: { id: string; slug: string } | null; error: { message: string } | null }

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? 'Create failed' }
  }

  await logAudit({
    actorId:       me.id,
    actorEmail:    me.email,
    action:        'author.created',
    resourceType:  'author',
    resourceId:    inserted.id,
    resourceLabel: name.trim(),
    metadata:      { slug },
  })

  revalidatePath('/admin/authors')
  revalidatePath('/authors')
  return { ok: true, authorId: inserted.id, slug: inserted.slug }
}

export async function updateAuthor(
  id:     string,
  fields: { name: string; bio: string | null; avatar_url: string | null },
): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }
  if (!fields.name.trim()) return { ok: false, error: 'Name is required' }

  const supabase = await createClient()

  // Fetch existing for audit + slug-change detection.
  const { data: existing } = await supabase
    .from('authors')
    .select('name, slug, avatar_url')
    .eq('id', id)
    .single()
  const old = existing as { name: string; slug: string; avatar_url: string | null } | null
  if (!old) return { ok: false, error: 'Author not found' }

  // If the name changed, regenerate the slug. Otherwise keep the existing slug
  // so old URLs stay valid.
  let nextSlug = old.slug
  if (fields.name.trim() !== old.name) {
    const baseSlug = slugifyAuthorName(fields.name)
    if (baseSlug && baseSlug !== old.slug) {
      nextSlug = await uniquifySlug(baseSlug, id)
    }
  }

  const { error } = await (supabase
    .from('authors')
    .update({
      name:       fields.name.trim(),
      slug:       nextSlug,
      bio:        fields.bio?.trim() || null,
      avatar_url: fields.avatar_url ?? null,
    } as never)
    .eq('id', id))

  if (error) return { ok: false, error: error.message }

  await logAudit({
    actorId:       me.id,
    actorEmail:    me.email,
    action:        'author.updated',
    resourceType:  'author',
    resourceId:    id,
    resourceLabel: fields.name.trim(),
    metadata:      { from: old.name, to: fields.name.trim(), slug: nextSlug },
  })

  revalidatePath('/admin/authors')
  revalidatePath(`/admin/authors/${id}`)
  revalidatePath('/authors')
  revalidatePath(`/authors/${nextSlug}`)
  if (nextSlug !== old.slug) revalidatePath(`/authors/${old.slug}`)
  return { ok: true, slug: nextSlug }
}

export async function deleteAuthor(id: string): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('authors')
    .select('name, slug, avatar_url')
    .eq('id', id)
    .single()
  const author = existing as { name: string; slug: string; avatar_url: string | null } | null
  if (!author) return { ok: false, error: 'Author not found' }

  /* Content rows are detached automatically by the ON DELETE SET NULL FK —
     they keep their `speaker` text so the byline keeps working without
     code changes. */

  const { error } = await supabase.from('authors').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  /* Best-effort: delete the avatar object too. Errors are non-fatal — a
     dangling object in the bucket is preferable to blocking the delete. */
  if (author.avatar_url) {
    try {
      const path = avatarPathFromPublicUrl(author.avatar_url)
      if (path) {
        await supabase.storage.from('author-avatars').remove([path])
      }
    } catch {
      /* swallow — see comment above */
    }
  }

  await logAudit({
    actorId:       me.id,
    actorEmail:    me.email,
    action:        'author.deleted',
    resourceType:  'author',
    resourceId:    id,
    resourceLabel: author.name,
    metadata:      { slug: author.slug },
  })

  revalidatePath('/admin/authors')
  revalidatePath('/authors')
  revalidatePath(`/authors/${author.slug}`)
  return { ok: true }
}

/**
 * Public-URL → storage path. The bucket is public so we store the
 * `getPublicUrl()` result in `authors.avatar_url`. To delete the object
 * we need to reconstruct the path from the URL.
 *
 *   https://<project>.supabase.co/storage/v1/object/public/author-avatars/<path>
 *
 * Returns null if the URL doesn't look like one of ours, so we don't try
 * to delete an unrelated remote object.
 */
function avatarPathFromPublicUrl(url: string): string | null {
  const marker = '/storage/v1/object/public/author-avatars/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}