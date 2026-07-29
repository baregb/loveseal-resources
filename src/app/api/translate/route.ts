import { NextResponse } from 'next/server'
import { translateContent } from '@/app/admin/(dashboard)/content/translate-actions'

/* Translating a long article into 4 locales — now split into multiple
   requests per field when the body is large — can run past the platform's
   default. 300s is the max Vercel allows on Hobby anyway; raise to 800 in
   vercel.json if this project moves to Pro and still needs more headroom. */
export const maxDuration = 300

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