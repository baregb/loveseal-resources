/**
 * Social link configuration for the public footer.
 *
 * URLs come from `NEXT_PUBLIC_SOCIAL_*` env vars so ministry team can update
 * them in Vercel without touching code. Each falls back to `#` if unset, which
 * means the icon still renders but the link is inert.
 *
 * Icon names map to inline SVGs in `FooterSocialIcons.tsx`. The visual styling
 * (background colour, gradient) lives here because it's brand identity, not
 * component implementation detail.
 */

export type SocialIconName = 'youtube' | 'tiktok' | 'x' | 'instagram' | 'linkedin'

export interface SocialLink {
  /** Display name (used for the accessible label) */
  name:       string
  /** External URL — `#` if env var not set */
  url:        string
  /** Solid background colour for the icon square. Mutually exclusive with `gradient`. */
  background?: string
  /** Gradient background (used for Instagram) */
  gradient?:  string
  /** Which inline SVG to render */
  icon:       SocialIconName
}

const env = (key: string): string => {
  /* `process.env` keys are inlined at build time when prefixed with
     NEXT_PUBLIC_, so this works on both server and client. */
  const v = process.env[key]
  return v && v.trim().length > 0 ? v.trim() : '#'
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    name:       'YouTube',
    url:        env('NEXT_PUBLIC_SOCIAL_YOUTUBE'),
    background: '#FF0000',
    icon:       'youtube',
  },
  {
    name:       'TikTok',
    url:        env('NEXT_PUBLIC_SOCIAL_TIKTOK'),
    background: '#000000',
    icon:       'tiktok',
  },
  {
    name:       'X',
    url:        env('NEXT_PUBLIC_SOCIAL_X'),
    background: '#0F1419',
    icon:       'x',
  },
  {
    name:     'Instagram',
    url:      env('NEXT_PUBLIC_SOCIAL_INSTAGRAM'),
    gradient: 'radial-gradient(circle at 30% 110%, #FFD75E 0%, #F95B3D 35%, #D6249F 65%, #4F5BD5 100%)',
    icon:     'instagram',
  },
  {
    name:       'LinkedIn',
    url:        env('NEXT_PUBLIC_SOCIAL_LINKEDIN'),
    background: '#0A66C2',
    icon:       'linkedin',
  },
] as const