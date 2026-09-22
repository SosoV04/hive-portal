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
 *
 * DRAWING — a 3/4 angled view, closer to natural-history illustration than to
 * a top-down specimen. Three things carry the perspective: the body sits on a
 * 15° axis rather than square to the frame, the two wings are deliberately
 * asymmetric (the near one larger and rounder, the far one smaller and
 * foreshortened behind the body), and the legs ground it from underneath.
 * There is no face — a dot for the head is enough.
 *
 * The artwork faces RIGHT. `direction="left"` mirrors it about the viewBox so
 * the bee can face its direction of travel.
 */

/** The insect's own axis. Body, stripes and head all share it. */
const BODY_TILT = -15
const BODY_CX = 14.5
const BODY_CY = 18

/**
 * Silhouette in body-local coordinates: blunt at the front, tapering to a
 * narrow rear. 15.8 long × 7.2 deep ≈ 2.2:1.
 */
const BODY_PATH = [
  'M 22 18',
  'C 22 20.3, 19.6 21.5, 16 21.6',
  'C 12.2 21.7, 8.2 20.6, 6.7 18.7',
  'C 6.2 18.3, 6.2 17.7, 6.7 17.3',
  'C 8.2 15.4, 12.2 14.3, 16 14.4',
  'C 19.6 14.5, 22 15.7, 22 18',
  'Z',
].join(' ')

/** Where both wings hinge — the top of the thorax, in root coordinates. */
const WING_HINGE = { x: 18.2, y: 14.2 }

/**
 * One wing beat, in seconds.
 *
 * Deliberately slow. The previous 0.42s cycle read as a vibration rather than
 * a wingbeat; at this speed the stroke is legible and the bee looks like it is
 * holding itself up rather than buzzing.
 */
const WING_BEAT_S = 0.7

export interface BeeProps {
  /** Width in pixels. Height is derived from the 32x32 viewBox. */
  size?: number
  /** 'static' sits still; 'flying' gently flutters its wings. */
  variant?: 'static' | 'flying'
  /** Which way the bee faces. 'left' mirrors the artwork horizontally. */
  direction?: 'left' | 'right'
  className?: string
}

export function Bee({ size = 28, variant = 'static', direction = 'right', className }: BeeProps) {
  // React's useId embeds ':' / '«»' — strip them so url(#id) stays a valid SVG reference.
  const clipId = 'bee-' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const flying = variant === 'flying'

  /**
   * The flutter hangs off a wrapping <motion.g> while each wing keeps its own
   * plain `transform` attribute — framer-motion's transform handling overwrites
   * that attribute when it is applied to a motion element directly, which once
   * left the wings detached from the body.
   */
  const beat = (delay: number) =>
    flying
      ? {
          animate: { scaleY: [1, 0.72, 1], rotate: [0, -7, 0] },
          transition: {
            duration: WING_BEAT_S,
            repeat: Infinity,
            ease: 'easeInOut' as const,
            delay,
          },
        }
      : {}

  // Both wings swing from the thorax, not from their own centres.
  const hinge = { originX: `${WING_HINGE.x}px`, originY: `${WING_HINGE.y}px` }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Bee"
      data-bee=""
      data-direction={direction}
      className={cn('overflow-visible', className)}
    >
      <defs>
        {/* Stripes are clipped to the silhouette, in the body's own frame. */}
        <clipPath id={clipId}>
          <path d={BODY_PATH} />
        </clipPath>
      </defs>

      <g transform={direction === 'left' ? 'translate(32, 0) scale(-1, 1)' : undefined}>
        {/*
          FAR wing — drawn first so the body occludes its root. Smaller, and
          pitched further back, which is what reads as "further away".
        */}
        <motion.g data-bee-beat="far" style={hinge} {...beat(0.06)}>
          <g transform="rotate(34 14.47 11.68)" data-bee-wing="far">
            <ellipse
              cx="14.47"
              cy="11.68"
              rx="4.5"
              ry="1.5"
              fill="var(--white)"
              fillOpacity="0.35"
              stroke="var(--ink)"
              strokeOpacity="0.55"
              strokeWidth="0.5"
            />
            <g stroke="var(--ink)" strokeOpacity="0.4" strokeWidth="0.26" fill="none">
              <path d="M18.3 11.6 C 16.5 11.05, 13 10.95, 10.5 11.4" />
              <path d="M18.3 11.85 C 16.5 12.35, 13 12.45, 11 12" />
            </g>
          </g>
        </motion.g>

        {/* Legs — barely there, just enough that the body is not floating. */}
        <g
          stroke="var(--ink)"
          strokeOpacity="0.5"
          strokeWidth="0.5"
          strokeLinecap="round"
          data-bee-legs=""
        >
          <path d="M18.2 20.4 L 19 22.3" />
          <path d="M15.2 21.4 L 15.4 23.5" />
          <path d="M12.2 21.9 L 11.6 23.9" />
        </g>

        <g transform={`rotate(${BODY_TILT} ${BODY_CX} ${BODY_CY})`} data-bee-body="">
          <path d={BODY_PATH} fill="var(--gold-deep)" />
          {/* Two stripes across the abdomen, upright in the body's frame so
              they follow its angle rather than the viewport's horizontal. */}
          <g clipPath={`url(#${clipId})`} fill="var(--ink)">
            <rect x="9" y="13" width="1.7" height="10" />
            <rect x="12.2" y="13" width="1.7" height="10" />
          </g>
          {/* Head: a dot. No eyes, no smile. */}
          <circle cx="21.6" cy="18" r="2.2" fill="var(--ink)" />
        </g>

        {/*
          NEAR wing — over the body, larger and less foreshortened. The overlap
          is what separates the two wings in depth.
        */}
        <motion.g data-bee-beat="near" style={hinge} {...beat(0)}>
          <g transform="rotate(14 12.86 12.87)" data-bee-wing="near">
            <ellipse
              cx="12.86"
              cy="12.87"
              rx="5.5"
              ry="2.1"
              fill="var(--white)"
              fillOpacity="0.35"
              stroke="var(--ink)"
              strokeOpacity="0.55"
              strokeWidth="0.5"
            />
            <g stroke="var(--ink)" strokeOpacity="0.4" strokeWidth="0.26" fill="none">
              <path d="M17.6 12.75 C 15 12, 11 11.8, 8 12.5" />
              <path d="M17.6 13.05 C 15 13.7, 11 13.9, 8.4 13.2" />
            </g>
          </g>
        </motion.g>
      </g>
    </svg>
  )
}
