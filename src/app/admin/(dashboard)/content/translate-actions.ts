'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/admin-user'
import { translateContentToAllLocales } from '@/lib/translate-content'
import { logAudit } from '@/lib/audit'
import type { Locale } from '@/types'

interface ActionResult {
  ok:        boolean
  error?:    string
  /** Locales that successfully translated. */
  succeeded?: Locale[]
  /** Locales that failed, with their error messages. */
  failed?:    { locale: Locale; message: string }[]
}

/**
 * Translate a content row into every non-source locale.
 * Returns a per-locale result so the UI can surface partial success.
 *
 * Auth: requires a logged-in admin.
 */
export async function translateContent(contentId: string): Promise<ActionResult> {
  const me = await getCurrentAdmin()
  if (!me) return { ok: false, error: 'Not authenticated' }

  const supabase = await createClient()
  const { data } = await supabase
    .from('content')
    .select('id, language, title, theme, series, speaker, body_html, extracted_text, summary_points, scripture_refs')
    .eq('id', contentId)
    .single()

  const item = data as {
    id:             string
    language:       Locale
    title:          string
    theme:          string | null
    series:         string | null
    speaker:        string | null
    body_html:      string | null
    extracted_text: string | null
    summary_points: string[] | null
    scripture_refs: string[]
  } | null

  if (!item) return { ok: false, error: 'Content not found' }

  // Nothing translatable
  if (!item.body_html && !item.extracted_text && !item.title) {
    return { ok: false, error: 'No text content to translate' }
  }

  try {
    const result = await translateContentToAllLocales(item)

    await logAudit({
      actorId:       me.id,
      actorEmail:    me.email,
      action:        'content.updated',
      resourceType:  'content',
      resourceId:    item.id,
      resourceLabel: item.title,
      metadata: {
        action_subtype: 'translation',
        source_locale:  item.language,
        succeeded:      result.ok,
        failed_count:   result.errors.length,
      },
    })

    // Invalidate the public pages so newly-translated locales render fresh
    revalidatePath('/admin/content')
    revalidatePath('/', 'layout')
    revalidatePath(`/content/${item.id}`, 'page')

    return {
      ok:        result.ok.length > 0,
      succeeded: result.ok,
      failed:    result.errors,
      error:     result.ok.length === 0 && result.errors.length > 0
                   ? `All locales failed: ${result.errors[0].message}`
                   : undefined,
    }
  } catch (err) {
    return {
      ok:    false,
      error: err instanceof Error ? err.message : 'Translation failed',
    }
  }
}