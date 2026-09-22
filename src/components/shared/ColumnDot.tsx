import { cn } from '../../lib/cn'
import type { BoardColumn } from '../../data/mock/board-posts'

/**
 * The small colour dot beside a Board column heading. Shared with the Board
 * page so a column keeps its colour in the preview and in the real thing.
 */
const DOT: Record<BoardColumn, string> = {
  'high-five': 'bg-gold',
  milestones: 'bg-success',
  'this-week': 'bg-gold-deep',
}

export function ColumnDot({ column, className }: { column: BoardColumn; className?: string }) {
  return (
    <span
      data-column-dot={column}
      aria-hidden="true"
      className={cn(
        'inline-block h-2 w-2 shrink-0 rounded-full transition-opacity duration-200 ease-out',
        // Sits at 70% and comes up to full when its column is hovered.
        'opacity-70 group-hover:opacity-100',
        DOT[column],
        className,
      )}
    />
  )
}
