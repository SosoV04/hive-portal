import { HEX_CLIP } from '../Hex'
import { cn } from '../../lib/cn'
import { timeAgoShort } from '../../lib/dates'
import type { BoardPost } from '../../data/mock/board-posts'
import { WALL_SKINS } from './columns'
import { hexHeight, TILE_GAP } from './honeycomb'

/**
 * One hex-clipped post on the Wall.
 *
 * The tile is absolutely positioned by the honeycomb layout; the 8px seam
 * between neighbours comes from insetting the drawn hexagon inside its lattice
 * cell rather than from a margin, which a tessellation has nowhere to put.
 *
 * Content is inset to 20% on each side: the top and bottom edges of a flat-top
 * hexagon only span the middle half of its width, so text that runs the full
 * width would poke out through the diagonals.
 */

export interface WallTileProps {
  post: BoardPost
  /** Lattice cell, in px from the wall's content box. */
  x: number
  y: number
  /** Lattice cell width; the tile itself is TILE_GAP narrower. */
  cellWidth: number
  onOpen: (post: BoardPost, x: number, y: number) => void
}

export function WallTile({ post, x, y, cellWidth, onOpen }: WallTileProps) {
  const skin = WALL_SKINS[post.column]
  const width = cellWidth - TILE_GAP
  const height = hexHeight(cellWidth) - TILE_GAP

  return (
    <button
      type="button"
      data-wall-tile={post.id}
      data-column={post.column}
      aria-label={`${post.team} — ${post.body}`}
      onClick={() => onOpen(post, x, y)}
      style={{
        position: 'absolute',
        left: x + TILE_GAP / 2,
        top: y + TILE_GAP / 2,
        width,
        height,
      }}
      className="wall-tile group absolute cursor-pointer"
    >
      {/* Ring layer — also the accent that brightens on hover. */}
      <span
        aria-hidden="true"
        className={cn('absolute inset-0 transition-colors duration-200 ease-out', skin.ring, 'group-hover:bg-gold-deep')}
        style={{ clipPath: HEX_CLIP }}
      />
      {/* Fill layer, inset by the ring's 2px. */}
      <span
        aria-hidden="true"
        data-wall-fill={post.column}
        className={cn('absolute inset-[2px]', skin.fill)}
        style={{ clipPath: HEX_CLIP }}
      />

      {/*
        Content is clipped to the same silhouette as a backstop: a tile that
        somehow outgrows its hexagon gets cut by the hexagon rather than
        spilling across its neighbours.
      */}
      <span
        className={cn(
          'relative flex h-full flex-col items-center justify-center gap-1.5 overflow-hidden px-[20%] text-center',
          skin.text,
        )}
        style={{ clipPath: HEX_CLIP }}
      >
        <span
          aria-hidden="true"
          className="flex items-center justify-center"
          style={{
            width: 24,
            aspectRatio: '1 / 0.8660254',
            background: skin.chip,
            clipPath: HEX_CLIP,
          }}
        >
          <span className={cn('font-display text-[0.5rem] font-black leading-none', skin.chipText)}>
            {post.teamInitials}
          </span>
        </span>

        {/*
          The voice is untouched: no capitalize, no trailing full stop added.
          Two lines on a phone, four from md up — a mobile tile is ~122px tall,
          and four lines of body-sm plus the chip and the stamp need ~134px, so
          the clamp is what gives instead of the line height or the type size.
        */}
        <span className="line-clamp-2 text-body-sm md:line-clamp-4">{post.body}</span>

        <span className={cn('text-caption uppercase', skin.text, 'opacity-60')}>
          {timeAgoShort(post.timestamp)}
        </span>
      </span>
    </button>
  )
}

/** A vacant comb cell — outline only, so the wall reads as having room to grow. */
export function WallEmptyCell({
  x,
  y,
  cellWidth,
}: {
  x: number
  y: number
  cellWidth: number
}) {
  const width = cellWidth - TILE_GAP
  const height = hexHeight(cellWidth) - TILE_GAP

  return (
    <span
      aria-hidden="true"
      data-wall-empty=""
      style={{ position: 'absolute', left: x + TILE_GAP / 2, top: y + TILE_GAP / 2, width, height }}
    >
      <span
        className="absolute inset-0 bg-gold-soft"
        style={{ clipPath: HEX_CLIP }}
      />
      <span
        className="absolute inset-[2px] bg-gold-soft/40"
        style={{ clipPath: HEX_CLIP }}
      />
    </span>
  )
}
