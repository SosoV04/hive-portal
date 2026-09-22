import { HEX_RATIO } from '../Hex'
import type { BoardPost } from '../../data/mock/board-posts'

/**
 * Honeycomb tessellation for the Wall view.
 *
 * GEOMETRY — the tiles are flat-top hexagons (the locked <Hex> shape), width W
 * and height H = W·√3/2. For that orientation the six edge-sharing neighbours
 * of a tile centred at (0,0) sit at (±1.5W, 0) and (±0.75W, ±H/2). So:
 *
 *   in-row pitch   1.5·W     (tiles in one row are 1.5 widths apart)
 *   row step       H / 2     (rows interlock, each sitting half a hex down)
 *   row offset     0.75·W    — exactly half the in-row pitch
 *
 * That 0.75W offset is the one number that differs from the brief, which asked
 * for "half a hex-width". Half a width is the correct offset for POINTY-top
 * hexagons (pitch W, row step 0.75H); applying it to flat-top tiles pulls
 * diagonal neighbours to 180px apart when the shared edge needs 190.5px, so
 * the tiles overlap and the seams stop being parallel. Offsetting by half the
 * in-row pitch is the same visual idea — every other row shifted — done in the
 * flat-top lattice, and it tessellates exactly.
 */

/** Visual seam between two tiles. Applied by insetting each tile, not by margin. */
export const TILE_GAP = 8

/** Desktop target tile width, before it is stretched to fill the container. */
export const TARGET_TILE_W = 220

/** Flat-top height for a given width. */
export function hexHeight(width: number) {
  return width * HEX_RATIO
}

export function rowPitch(width: number) {
  return width * 1.5
}

export function rowOffset(width: number) {
  return width * 0.75
}

export function rowStep(width: number) {
  return hexHeight(width) / 2
}

/**
 * Tile width for a container.
 *
 * Desktop stretches the 220px target so a whole number of tiles spans the
 * container and the wall has no dead gutter on the right. Mobile takes the
 * brief's 45vw as a ceiling but is capped by what the lattice can actually fit
 * two-up: 1.5W + W ≤ container, i.e. W ≤ container / 2.5.
 */
export function tileWidthFor(containerWidth: number) {
  if (containerWidth <= 0) return TARGET_TILE_W

  // Mobile: two tiles per row is the requirement, so the pitch sets the cap.
  if (containerWidth < 640) {
    return Math.max(120, Math.min(containerWidth * 0.45, containerWidth / 2.5))
  }

  const perRow = Math.max(
    1,
    Math.round((containerWidth + 0.5 * TARGET_TILE_W) / rowPitch(TARGET_TILE_W)),
  )
  const fitted = containerWidth / (1.5 * perRow - 0.5)
  return Math.min(260, Math.max(190, fitted))
}

/** How many tiles fit in a row that starts `startX` from the left edge. */
function tilesInRow(containerWidth: number, width: number, startX: number) {
  return Math.max(1, Math.floor((containerWidth - width - startX) / rowPitch(width)) + 1)
}

export interface HoneycombCell {
  /** Left edge, px from the container's content box. */
  x: number
  /** Top edge, px. */
  y: number
  row: number
  col: number
}

export interface HoneycombLayout {
  cells: HoneycombCell[]
  width: number
  height: number
  perRow: [even: number, odd: number]
}

/** Place `count` cells into the lattice, centred horizontally in the container. */
export function layoutHoneycomb(
  count: number,
  containerWidth: number,
  width = tileWidthFor(containerWidth),
): HoneycombLayout {
  const pitch = rowPitch(width)
  const offset = rowOffset(width)
  const step = rowStep(width)
  const even = tilesInRow(containerWidth, width, 0)
  const odd = tilesInRow(containerWidth, width, offset)

  // Widest row decides the lattice width, and the leftovers are split so the
  // wall sits centred rather than hugging the left gutter.
  const latticeWidth = Math.max((even - 1) * pitch + width, (odd - 1) * pitch + width + offset)
  const padLeft = Math.max(0, (containerWidth - latticeWidth) / 2)

  const cells: HoneycombCell[] = []
  let row = 0
  let col = 0
  for (let i = 0; i < count; i++) {
    const rowCount = row % 2 === 0 ? even : odd
    if (col >= rowCount) {
      row += 1
      col = 0
    }
    const rowStart = row % 2 === 0 ? 0 : offset
    cells.push({
      x: padLeft + rowStart + col * pitch,
      y: row * step,
      row,
      col,
    })
    col += 1
  }

  const rows = cells.length ? cells[cells.length - 1].row + 1 : 0
  return {
    cells,
    width,
    height: rows === 0 ? 0 : (rows - 1) * step + hexHeight(width),
    perRow: [even, odd],
  }
}

export type WallCell = { kind: 'post'; post: BoardPost } | { kind: 'empty'; key: string }

/** Tiny deterministic LCG — the empty cells must scatter the same way every render. */
function lcg(seed: number) {
  let state = seed % 2147483647
  if (state <= 0) state += 2147483646
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

/**
 * Posts interleaved with empty comb cells.
 *
 * Roughly 18% of the wall is left as vacant outline-only cells so it reads as
 * a board with room to grow. Positions come from a seeded generator rather
 * than Math.random so the pattern is stable across re-renders (and across test
 * runs), and slot 0 is never empty — the wall should open with content.
 */
export function buildWallCells(posts: BoardPost[], seed = 1987): WallCell[] {
  if (posts.length === 0) return []

  const emptyCount = Math.max(2, Math.round(posts.length * 0.18))
  const total = posts.length + emptyCount
  const random = lcg(seed)
  const blanks = new Set<number>()
  let guard = 0
  while (blanks.size < emptyCount && guard++ < 500) {
    const slot = 1 + Math.floor(random() * (total - 1))
    // No two blanks back to back: a gap of two reads as a hole, not a pause.
    if (!blanks.has(slot) && !blanks.has(slot - 1) && !blanks.has(slot + 1)) blanks.add(slot)
  }

  const cells: WallCell[] = []
  let next = 0
  for (let slot = 0; slot < total; slot++) {
    if (blanks.has(slot)) cells.push({ kind: 'empty', key: `empty-${slot}` })
    else cells.push({ kind: 'post', post: posts[next++] })
  }
  // Any blank that the guard failed to place leaves posts behind; append them.
  while (next < posts.length) cells.push({ kind: 'post', post: posts[next++] })
  return cells
}
