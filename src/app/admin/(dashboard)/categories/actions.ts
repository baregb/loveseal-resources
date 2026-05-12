'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/admin-user'
import { logAudit } from '@/lib/audit'
import type { ContentType } from '@/types'

interface ActionResult {
  ok:    boolean
  error?: string
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createCategory(
  name: string,
  contentType: ContentType | 'all',
): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }

  if (!name.trim()) return { ok: false, error: 'Name is required' }

  const supabase = await createClient()
  const slug = slugify(name)

  const { data: inserted, error } = await (supabase
    .from('categories')
    .insert({
      name:         name.trim(),
      slug,
      content_type: contentType === 'all' ? null : contentType,
    } as never)
    .select('id')
    .single()) as { data: { id: string } | null; error: { message: string } | null }

  if (error || !inserted) {
    if (error?.message.includes('duplicate')) {
      return { ok: false, error: 'A category with this name already exists' }
    }
    return { ok: false, error: error?.message ?? 'Create failed' }
  }

  await logAudit({
    actorId:       me.id,
    actorEmail:    me.email,
    action:        'category.created',
    resourceType:  'category',
    resourceId:    inserted.id,
    resourceLabel: name.trim(),
    metadata:      { content_type: contentType, slug },
  })

  revalidatePath('/admin/categories')
  return { ok: true }
}

export async function renameCategory(id: string, newName: string): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }

  if (!newName.trim()) return { ok: false, error: 'Name is required' }

  const supabase = await createClient()

  // Fetch existing for audit
  const { data: existing } = await supabase
    .from('categories')
    .select('name, slug')
    .eq('id', id)
    .single()
  const old = existing as { name: string; slug: string } | null
  if (!old) return { ok: false, error: 'Category not found' }

  const newSlug = slugify(newName)

  const { error } = await (supabase
    .from('categories')
    .update({ name: newName.trim(), slug: newSlug } as never)
    .eq('id', id))

  if (error) return { ok: false, error: error.message }

  // If the slug changed, update content rows that reference the old slug
  if (newSlug !== old.slug) {
    await (supabase
      .from('content')
      .update({ category: newSlug } as never)
      .eq('category', old.slug))
  }

  await logAudit({
    actorId:       me.id,
    actorEmail:    me.email,
    action:        'category.updated',
    resourceType:  'category',
    resourceId:    id,
    resourceLabel: newName.trim(),
    metadata:      { from: old.name, to: newName.trim() },
  })

  revalidatePath('/admin/categories')
  return { ok: true }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('categories')
    .select('name, slug')
    .eq('id', id)
    .single()
  const cat = existing as { name: string; slug: string } | null
  if (!cat) return { ok: false, error: 'Category not found' }

  // Clear the category from content rows that use it
  await (supabase.from('content').update({ category: '' } as never).eq('category', cat.slug))

  // Delete the category itself
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  await logAudit({
    actorId:       me.id,
    actorEmail:    me.email,
    action:        'category.deleted',
    resourceType:  'category',
    resourceId:    id,
    resourceLabel: cat.name,
  })

  revalidatePath('/admin/categories')
  return { ok: true }
}
