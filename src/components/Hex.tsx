import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../lib/cn'

/**
 * Hexagon primitive.
 *
 * STRICT USAGE RULE — hexagons appear in exactly two places across the site:
 *   1. Avatar / logo / category-badge frames (founder photos, team logos)
 *   2. The Board's "Wall" view (honeycomb tiling of post tiles)
 * Nowhere else. No background patterns, no floating hex decoration,
 * no hex section dividers.
 */

/** Flat-top hexagon. LOCKED. */
const HEX_CLIP = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'

/** A regular flat-top hexagon is 0.866 as tall as it is wide (√3 / 2). */
const HEX_RATIO = 0.8660254

export type HexVariant = 'filled' | 'outline' | 'photo'

export interface HexProps {
  /**
   * Width in pixels. Height is derived so the hexagon stays regular, and the
   * hexagon shrinks with its container if the container is narrower than this
   * (which is how the 380px hero photo survives a 390px phone).
   */
  size?: number
  /** Image source — only rendered when variant is 'photo'. */
  src?: string
  alt?: string
  /** Text or icon centered inside the hexagon. */
  children?: ReactNode
  variant?: HexVariant
  /** Fill (filled) or ring (outline) color. Defaults to gold. */
  color?: string
  className?: string
}

export function Hex({
  size = 64,
  src,
  alt = '',
  children,
  variant = 'filled',
  color = 'var(--gold)',
  className,
}: HexProps) {
  const ring = variant === 'outline' ? color : 'var(--border)'
  const fill = variant === 'filled' ? color : 'var(--white)'

  return (
    <div
      data-hex=""
      className={cn(
        // self-start matters: height comes from aspect-ratio, so a stretching
        // flex parent would otherwise pull the hexagon into a tall slab.
        // Consumers can still override it (cn merges the align-self group).
        'group relative shrink-0 self-start transition-transform duration-200 ease-out hover:scale-[1.03]',
        className,
      )}
      style={
        {
          width: size,
          maxWidth: '100%',
          // aspect-ratio rather than a fixed height: it keeps √3/2 exactly,
          // including when max-width has scaled the hexagon down.
          aspectRatio: `1 / ${HEX_RATIO}`,
          '--hex-ring': ring,
          '--hex-fill': fill,
        } as CSSProperties
      }
    >
      {/* Outer layer is the 1px border. */}
      <div
        className="absolute inset-0 bg-[var(--hex-ring)] transition-colors duration-200 ease-out group-hover:bg-gold-deep"
        style={{ clipPath: HEX_CLIP }}
      />
      {/* Inner layer, inset by 1px, carries the fill or the photo. */}
      <div
        className="absolute inset-px flex items-center justify-center overflow-hidden bg-[var(--hex-fill)] transition-colors duration-200 ease-out group-hover:bg-gold-deep"
        style={{ clipPath: HEX_CLIP }}
      >
        {variant === 'photo' && src ? (
          <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export { HEX_CLIP, HEX_RATIO }
