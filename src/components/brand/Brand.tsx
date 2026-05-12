/**
 * The brand identity for Lively Resources by LoveSeal Church.
 *
 * Two presentations:
 *  - <BrandName /> renders the full name with 'by LoveSeal Church' inset & italicized
 *  - <BrandShort /> just renders 'Lively Resources'
 *  - For places that need a string only, use BRAND.full / BRAND.short / BRAND.byline
 */

export const BRAND = {
  full:    'Lively Resources by LoveSeal Church',
  short:   'Lively Resources',
  byline:  'by LoveSeal Church',
  parent:  'LoveSeal Church',
} as const

interface BrandNameProps {
  /** Size variant — default 'md' */
  size?:    'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Override the colour of the main name (defaults to current text colour) */
  color?:   string
  /** Override the colour of the byline (defaults to faded version) */
  bylineColor?: string
  /** If true, stack the byline below on a new line instead of inline */
  stacked?: boolean
}

const sizeMap = {
  xs: { name: '11px', byline: '8px',   gap: '3px' },
  sm: { name: '14px', byline: '9px',   gap: '4px' },
  md: { name: '17px', byline: '10px',  gap: '5px' },
  lg: { name: '24px', byline: '12px',  gap: '6px' },
  xl: { name: '32px', byline: '14px',  gap: '8px' },
}

export function BrandName({
  size  = 'md',
  color,
  bylineColor,
  stacked = false,
}: BrandNameProps) {
  const s = sizeMap[size]

  return (
    <span style={{
      display:        stacked ? 'inline-block' : 'inline-flex',
      flexDirection:  stacked ? undefined : 'row',
      alignItems:     stacked ? undefined : 'baseline',
      gap:            stacked ? undefined : s.gap,
      lineHeight:     1.15,
    }}>
      <span style={{
        fontSize:    s.name,
        fontWeight:  600,
        color:       color ?? 'inherit',
        letterSpacing: '-0.01em',
        fontFamily:  'var(--font-body)',
      }}>
        Lively Resources
      </span>
      <span style={{
        display:     stacked ? 'block' : 'inline',
        fontSize:    s.byline,
        fontStyle:   'italic',
        fontWeight:  400,
        color:       bylineColor ?? 'var(--text-muted)',
        letterSpacing: '0.02em',
        marginTop:   stacked ? '2px' : undefined,
      }}>
        by LoveSeal Church
      </span>
    </span>
  )
}

interface BrandShortProps {
  size?:  'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: string
}

export function BrandShort({ size = 'md', color }: BrandShortProps) {
  const s = sizeMap[size]
  return (
    <span style={{
      fontSize:    s.name,
      fontWeight:  600,
      color:       color ?? 'inherit',
      letterSpacing: '-0.01em',
      fontFamily:  'var(--font-body)',
    }}>
      Lively Resources
    </span>
  )
}
