'use client'

import { motion, useReducedMotion } from 'framer-motion'

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
 */
export default function RevealOnScroll({
  children,
  delay    = 0,
  yOffset  = 24,
  duration = 0.7,
}: RevealOnScrollProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <>{children}</>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
