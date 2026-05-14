'use client'

import Image from 'next/image'
import { useTheme } from '@/components/theme/ThemeProvider'

/**
 * Logo tile for "Lively Resources by LoveSeal Church".
 *
 * The SVG file is at `public/brand/wordmark-light.svg` (for light-themed
 * pages) and `public/brand/wordmark-dark.svg` (for dark-themed pages). Both
 * are placeholder art generated from DejaVu Sans Condensed. To replace with
 * the real brand SVGs, just drop new files at the same paths — no code
 * changes required.
 *
 * The SVG is a self-contained tile (background + foreground): on a light bg,
 * we want a black tile (high contrast); on a dark bg, an inverted white tile.
 * The `resolved` value from ThemeProvider tells us which to use.
 */
export default function BrandLogo({
  size = 40,
}: {
  /** Pixel size of the square tile. Default 40. */
  size?: number
}) {
  const { resolved } = useTheme()
  const src = resolved === 'dark' ? '/brand/wordmark-dark.svg' : '/brand/wordmark-light.svg'

  return (
    <Image
      src={src}
      alt="Lively Resources"
      width={size}
      height={size}
      priority
      style={{ display: 'block', borderRadius: '4px' }}
    />
  )
}