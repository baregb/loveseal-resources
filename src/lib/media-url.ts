/**
 * Normalisation for externally-hosted media URLs typed into the admin forms.
 *
 * Real sermon audio lives on a CloudFront distribution whose S3 keys contain
 * literal spaces:
 *
 *   https://…/July2026/2026_07_19 - Sunday Service - Rev Kayode Oyegoke.mp3
 *
 * That file serves fine — a browser percent-encodes the spaces itself when it
 * resolves the `src` on the <audio> element. The problem is everything before
 * playback: a space in the path is a validation error under the URL spec, so
 * an `<input type="url">` is entitled to reject the value outright, and each
 * engine draws that line in a slightly different place. Storing the raw string
 * leaves us depending on which browser the admin happened to paste it into.
 *
 * Running the value through the URL parser once at save time settles it. The
 * parser percent-encodes the spaces (and lowercases the host, and resolves any
 * dot segments), so what lands in `content.audio_url` is already the form the
 * browser would have requested anyway.
 *
 * Anything the parser rejects is passed through trimmed rather than dropped:
 * the column is free text, and a bad URL that reaches the reader simply fails
 * to play, which the admin can see and fix. Silently nulling their input would
 * be the worse failure.
 */

export function normalizeMediaUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  try {
    return new URL(trimmed).href
  } catch {
    return trimmed
  }
}
