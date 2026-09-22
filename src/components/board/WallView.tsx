import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { EmptyState } from '../EmptyState'
import { ColumnDot } from '../shared/ColumnDot'
import { BOARD_COLUMNS, type BoardColumn, type BoardPost } from '../../data/mock/board-posts'
import { COLUMN_TITLES } from './columns'
import { buildWallCells, hexHeight, layoutHoneycomb, tileWidthFor } from './honeycomb'
import { PostCard, type ReactionKind } from './PostCard'
import { WallEmptyCell, WallTile } from './WallTile'

export interface WallViewProps {
  /** Already filtered and sorted newest-first. */
  posts: BoardPost[]
  visibleColumns: Record<BoardColumn, boolean>
  reacted: Record<string, { bee: boolean; heart: boolean }>
  onReact: (postId: string, kind: ReactionKind) => void
}

const DETAIL_W = 320

/**
 * The honeycomb. See honeycomb.ts for the lattice maths — including why every
 * other row is shifted by three quarters of a tile width and not a half.
 *
 * On mobile the wall breaks out of the container gutters: two tiles per row is
 * the point of the layout, and the lattice needs the full viewport width to
 * fit two at a legible size.
 */
export function WallView({ posts, visibleColumns, reacted, onReact }: WallViewProps) {
  const host = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [detail, setDetail] = useState<{ post: BoardPost; x: number; y: number } | null>(null)

  useLayoutEffect(() => {
    const el = host.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!detail) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDetail(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detail])

  const cells = useMemo(() => buildWallCells(posts), [posts])
  const layout = useMemo(
    () => layoutHoneycomb(cells.length, width, tileWidthFor(width)),
    [cells.length, width],
  )

  const openDetail = useCallback((post: BoardPost, x: number, y: number) => {
    setDetail((current) => (current?.post.id === post.id ? null : { post, x, y }))
  }, [])

  // Derived, not synced: a tile that filters away takes its popover with it,
  // because the popover only renders when its post is still in the set.
  const detailPost = detail ? posts.find((post) => post.id === detail.post.id) : undefined

  if (posts.length === 0) {
    return <EmptyState compact title="Nothing here yet." className="py-16" />
  }

  return (
    <div data-wall-view="" className="relative -mx-6 px-2 md:mx-0 md:px-0">
      <div
        ref={host}
        data-wall-grid=""
        className="relative"
        style={{ height: width > 0 ? layout.height : hexHeight(220) * 2 }}
      >
        {width > 0
          ? cells.map((cell, index) => {
              const { x, y } = layout.cells[index]
              return cell.kind === 'post' ? (
                <WallTile
                  key={cell.post.id}
                  post={cell.post}
                  x={x}
                  y={y}
                  cellWidth={layout.width}
                  onOpen={openDetail}
                />
              ) : (
                <WallEmptyCell key={cell.key} x={x} y={y} cellWidth={layout.width} />
              )
            })
          : null}

        {detail && detailPost ? (
          <div
            data-wall-detail={detailPost.id}
            role="dialog"
            aria-label={`Post from ${detailPost.team}`}
            className="absolute z-40 w-80 max-w-[calc(100vw-2rem)]"
            style={{
              left: Math.max(0, Math.min(detail.x, Math.max(0, width - DETAIL_W))),
              top: detail.y + hexHeight(layout.width) * 0.55,
            }}
          >
            <div className="relative">
              <PostCard
                post={detailPost}
                reacted={reacted[detailPost.id] ?? { bee: false, heart: false }}
                onReact={onReact}
                className="shadow-md"
              />
              <button
                type="button"
                data-wall-detail-close=""
                aria-label="Close post"
                onClick={() => setDetail(null)}
                className="absolute -right-2 -top-2 rounded-full border border-border bg-white p-1.5 text-ink/60 shadow-sm transition-colors duration-200 ease-out hover:border-gold hover:text-gold-deep"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/*
        No sticky column headers out here, so the legend is how a tile's colour
        gets a name. Floating bottom-right, out of the honeycomb's way.
      */}
      <div
        data-wall-legend=""
        className="pointer-events-none sticky bottom-6 z-30 ml-auto mt-6 flex w-fit flex-row flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-border bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:flex-col md:items-start md:gap-1.5"
      >
        {BOARD_COLUMNS.filter((column) => visibleColumns[column]).map((column) => (
          <p key={column} className="flex items-center gap-2 text-body-sm text-ink">
            <ColumnDot column={column} />
            {COLUMN_TITLES[column]}
          </p>
        ))}
      </div>
    </div>
  )
}
