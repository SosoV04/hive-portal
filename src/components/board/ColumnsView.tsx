import { Plus } from 'lucide-react'
import { EmptyState } from '../EmptyState'
import { ColumnDot } from '../shared/ColumnDot'
import { cn } from '../../lib/cn'
import { BOARD_COLUMNS, type BoardColumn, type BoardPost } from '../../data/mock/board-posts'
import { COLUMN_TITLES } from './columns'
import { PostCard, type ReactionKind } from './PostCard'

export interface ColumnsViewProps {
  /** Already filtered and sorted newest-first. */
  posts: BoardPost[]
  visibleColumns: Record<BoardColumn, boolean>
  reacted: Record<string, { bee: boolean; heart: boolean }>
  newPostIds: string[]
  onReact: (postId: string, kind: ReactionKind) => void
  onAddPost: (column: BoardColumn) => void
}

const GRID_COLS: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
}

const NO_REACTIONS = { bee: false, heart: false }

export function ColumnsView({
  posts,
  visibleColumns,
  reacted,
  newPostIds,
  onReact,
  onAddPost,
}: ColumnsViewProps) {
  const columns = BOARD_COLUMNS.filter((column) => visibleColumns[column])

  return (
    <div
      data-columns-view=""
      className={cn('grid grid-cols-1 gap-8', GRID_COLS[columns.length] ?? 'md:grid-cols-3')}
    >
      {columns.map((column) => {
        const inColumn = posts.filter((post) => post.column === column)
        return (
          <section key={column} data-board-column={column} aria-labelledby={`column-${column}`}>
            {/*
              Column headers stick just under the filter bar: 73px of nav
              (72px row + 1px border) plus whatever the bar currently measures
              — it grows by a line when the filter summary appears — which the
              bar publishes as --board-filter-h.
            */}
            <header
              data-column-header={column}
              className="sticky z-20 -mx-2 mb-4 flex items-center gap-2 bg-cream px-2 py-3"
              style={{ top: 'calc(73px + var(--board-filter-h, 60px))' }}
            >
              <ColumnDot column={column} />
              <h2
                id={`column-${column}`}
                className="font-sans text-body-lg font-semibold text-black"
              >
                {COLUMN_TITLES[column]}
              </h2>
              <span
                data-column-count={column}
                className="rounded-full bg-gold-soft px-2 py-0.5 text-caption font-semibold text-gold-deep"
              >
                {inColumn.length}
              </span>
              <button
                type="button"
                data-add-post-trigger={column}
                aria-label={`Post to ${COLUMN_TITLES[column]}`}
                onClick={() => onAddPost(column)}
                className="ml-auto rounded-full border border-border bg-white p-1.5 text-ink/60 transition-colors duration-200 ease-out hover:border-gold hover:bg-gold-soft hover:text-gold-deep"
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </header>

            {inColumn.length === 0 ? (
              <EmptyState compact title="Nothing here yet." />
            ) : (
              <div className="flex flex-col gap-4">
                {inColumn.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    reacted={reacted[post.id] ?? NO_REACTIONS}
                    onReact={onReact}
                    isNew={newPostIds.includes(post.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
