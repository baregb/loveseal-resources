'use client'

import { useEffect, useRef, useState } from 'react'

interface RevealOnScrollProps {
  children:    React.ReactNode
  /** Delay before this element animates (seconds) */
  delay?:      number
  /** How far the element starts below its final position (px) */
  yOffset?:    number
  /** Override duration in seconds */
  duration?:   number
}

/**
 * Animates children with a fade + subtle slide up when they enter the viewport.
 * Respects prefers-reduced-motion — falls back to no animation.
 *
 * Implementation note: this used to use framer-motion, but framer-motion is
 * ~40KB gzipped and this component is used many times on the landing page —
 * by far the biggest contribution to the home-page JS bundle. Re-implementing
 * with IntersectionObserver + CSS transitions drops the bundle cost to zero
 * while keeping the exact same public API.
 */
export default function RevealOnScroll({
  children,
  delay    = 0,
  yOffset  = 24,
  duration = 0.7,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    /* Respect the OS-level reduced-motion preference. We have to read it on
       the client to avoid SSR/hydration mismatch. */
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) {
      setRevealed(true)
      return
    }

    const el = ref.current
    if (!el) return

    /* viewport amount 0.15 mirrors framer-motion's previous { amount: 0.15 }.
       The observer fires once and then disconnects — same as { once: true }. */
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true)
            io.disconnect()
            return
          }
        }
      },
      { threshold: 0.15 },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [prefersReducedMotion])

  /* If reduced motion is on, render with no transition AT ALL — saves the
     transition property too. */
  if (prefersReducedMotion) {
    return <div ref={ref}>{children}</div>
  }

  /* The animation: start transparent + offset, end visible + in-place. We
     use a cubic-bezier matching the previous framer-motion `[0.16, 1, 0.3, 1]`
     ease, which is the canonical "ease-out-expo" curve. */
  return (
    <div
      ref={ref}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : `translateY(${yOffset}px)`,
        transition: `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        willChange: revealed ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}