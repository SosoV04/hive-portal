import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../lib/cn'

/**
 * Bee primitive.
 *
 * STRICT USAGE RULE — bees appear in exactly three moments:
 *   1. The favicon (see public/favicon.svg)
 *   2. Empty states ("No posts yet — the hive is quiet")
 *   3. The Home page scroll flight-path (hero → wins → events → board preview)
 * Nowhere else. No bees on cards, in the nav, or in the footer.
 */

export interface BeeProps {
  /** Width in pixels. Height is derived from the 32x32 viewBox. */
  size?: number
  /** 'static' sits still; 'flying' gently flutters its wings. */
  variant?: 'static' | 'flying'
  className?: string
}

export function Bee({ size = 48, variant = 'static', className }: BeeProps) {
  // React's useId embeds ':' / '«»' — strip them so url(#id) stays a valid SVG reference.
  const clipId = 'bee-' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const flying = variant === 'flying'

  // Wings beat softly; ease-in-out, never bouncy.
  const wing = flying
    ? {
        animate: { scaleY: [1, 0.72, 1], rotate: [0, -6, 0] },
        transition: { duration: 0.42, repeat: Infinity, ease: 'easeInOut' as const },
      }
    : {}

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Bee"
      data-bee=""
      className={cn('overflow-visible', className)}
    >
      <defs>
        <clipPath id={clipId}>
          <ellipse cx="16" cy="19.5" rx="6.2" ry="8.2" />
        </clipPath>
      </defs>

      {/*
        Wings sit behind the body and overlap the shoulders, so the body edge
        crops them and they read as attached rather than floating.
        The rotation stays on plain <ellipse> transform attributes — putting it
        on a motion element lets framer-motion's own transform handling
        overwrite it — and the flutter is driven on their shared group.
      */}
      <motion.g style={{ originX: '16px', originY: '16px' }} {...wing}>
        <g fill="var(--white)" fillOpacity="0.8" stroke="var(--gold-deep)" strokeWidth="0.9">
          <ellipse cx="10.5" cy="15" rx="5.8" ry="3.2" transform="rotate(-32 10.5 15)" />
          <ellipse cx="21.5" cy="15" rx="5.8" ry="3.2" transform="rotate(32 21.5 15)" />
        </g>
      </motion.g>

      {/* antennae */}
      <g stroke="var(--black)" strokeWidth="1.3" strokeLinecap="round">
        <path d="M13.6 5.4c-1.1-1.3-2.6-1.8-3.9-1.6" />
        <path d="M18.4 5.4c1.1-1.3 2.6-1.8 3.9-1.6" />
      </g>

      {/* body */}
      <ellipse cx="16" cy="19.5" rx="6.2" ry="8.2" fill="var(--gold)" />
      <g clipPath={`url(#${clipId})`} fill="var(--black)">
        <rect x="9" y="15.2" width="14" height="2.8" rx="1.4" />
        <rect x="9" y="20.4" width="14" height="2.8" rx="1.4" />
        <rect x="9" y="25.6" width="14" height="2.8" rx="1.4" />
      </g>
      <ellipse
        cx="16"
        cy="19.5"
        rx="6.2"
        ry="8.2"
        fill="none"
        stroke="var(--gold-deep)"
        strokeWidth="0.9"
      />

      {/* head */}
      <circle cx="16" cy="9.2" r="4.6" fill="var(--black)" />
    </svg>
  )
}
