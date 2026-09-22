import { Link } from 'react-router-dom'
import { Reveal } from '../Reveal'
import { SectionEyebrow } from '../SectionEyebrow'
import { PostCard } from '../board/PostCard'
import { ColumnDot } from '../shared/ColumnDot'
import { BOARD_COLUMNS, COLUMN_LABELS, postsInColumn } from '../../data/mock/board-posts'

/**
 * A three-column miniature of the Board, showing the newest post per column.
 * Mirrors the real Board's structure so the full page is never a surprise.
 */
export function BoardPreview() {
  return (
    <section data-section="board-preview" className="bg-cream py-24">
      <div className="container-hive">
        <Reveal className="flex flex-wrap items-baseline justify-between gap-4">
          <SectionEyebrow>ON THE BOARD</SectionEyebrow>
          <Link
            to="/board"
            className="text-body-sm font-semibold text-ink transition-colors duration-200 ease-out hover:text-gold-deep"
          >
            Open the board →
          </Link>
        </Reveal>

        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {BOARD_COLUMNS.map((column, index) => {
            const newest = postsInColumn(column)[0]
            return (
              <Reveal as="li" key={column} delay={index * 0.06}>
                <Link
                  to="/board"
                  data-board-column={column}
                  // `group` drives both the column lift and the dot brightening.
                  className={
                    'group block h-full rounded-2xl border border-border bg-white p-6 ' +
                    'transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-md'
                  }
                >
                  <p className="flex items-center gap-2 font-sans text-caption font-semibold uppercase text-ink/60">
                    <ColumnDot column={column} />
                    {COLUMN_LABELS[column]}
                  </p>
                  <div className="mt-5">
                    <PostCard post={newest} variant="preview" />
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
