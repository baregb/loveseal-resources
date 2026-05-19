'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'

/**
 * Date stamp that updates every minute.
 *
 * Server-renders nothing (returns null) so SSR HTML has no time data, avoiding
 * a hydration mismatch — the client fills it in on mount. Then `setInterval`
 * re-renders every 60s so a long-open tab stays accurate around midnight.
 *
 * Used in `LandingHero`'s eyebrow position above the headline, per the Pass 1
 * Q2 spec.
 */
export default function LiveDate({
  format = 'long',
  className,
  style,
}: {
  /** 'long' = "WEDNESDAY, MAY 13" · 'short' = "WED, MAY 13" */
  format?:    'long' | 'short'
  className?: string
  style?:     React.CSSProperties
}) {
  const locale = useLocale()
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!now) return null

  const text = formatDate(now, locale, format)

  return (
    <span className={className} style={style}>
      {text.toUpperCase()}
    </span>
  )
}

function formatDate(d: Date, locale: string, format: 'long' | 'short'): string {
  try {
    const weekday = d.toLocaleDateString(locale, {
      weekday: format === 'long' ? 'long' : 'short',
    })
    const monthDay = d.toLocaleDateString(locale, {
      month: 'short',
      day:   'numeric',
    })
    return `${weekday}, ${monthDay}`
  } catch {
    /* Defensive: if Intl ever rejects the locale tag, fall back to en. */
    return d.toLocaleDateString('en', {
      weekday: format === 'long' ? 'long' : 'short',
      month:   'short',
      day:     'numeric',
    }).toUpperCase()
  }
}