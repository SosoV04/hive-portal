import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'

const EASE_HIVE = [0.22, 1, 0.36, 1] as const

/**
 * The one sanctioned section reveal: 12px up + fade, 400ms, once.
 *
 * Deliberately the only entrance animation in the system. If a section needs
 * to "arrive", it arrives like this — no stagger cascades, no parallax, no
 * scale. `once: true` means scrolling back up does not replay anything.
 */
export function Reveal({
  children,
  delay = 0,
  as = 'div',
  ...rest
}: {
  children: ReactNode
  /** Small offsets only — used to walk a row of cards, never to stage a show. */
  delay?: number
  as?: 'div' | 'section' | 'li' | 'article'
} & HTMLMotionProps<'div'>) {
  const reduceMotion = useReducedMotion()
  // motion.li and motion.div disagree on their event-handler element types.
  // The wrapper only ever forwards className/style/children, so treating them
  // all as motion.div is accurate enough and keeps the call sites clean.
  const Tag = motion[as] as typeof motion.div

  if (reduceMotion) {
    return <Tag {...rest}>{children}</Tag>
  }

  return (
    <Tag
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      // -8% pulls the trigger slightly inside the viewport edge so a section
      // is already settled by the time it is properly on screen.
      viewport={{ once: true, margin: '-8%' }}
      transition={{ duration: 0.4, ease: EASE_HIVE, delay }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
