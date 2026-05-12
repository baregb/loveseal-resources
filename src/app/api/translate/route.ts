import { NextResponse } from 'next/server'
import { translateContent } from '@/app/admin/(dashboard)/content/translate-actions'

/**
 * Fire-and-forget endpoint the upload form calls after a save succeeds.
 * Triggers Microsoft Translator translation of the new content into all
 * non-source locales.
 *
 * Auth is enforced inside translateContent() via getCurrentAdmin().
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as { contentId?: string }
    const { contentId } = body
    if (!contentId) {
      return NextResponse.json({ ok: false, error: 'contentId required' }, { status: 400 })
    }

    const result = await translateContent(contentId)

    return NextResponse.json({
      ok:        result.ok,
      succeeded: result.succeeded,
      failed:    result.failed,
      error:     result.error,
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}