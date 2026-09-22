import { Columns3, Hexagon, Plus } from 'lucide-react'
import { Button } from '../Button'
import { SectionEyebrow } from '../SectionEyebrow'
import { cn } from '../../lib/cn'

export type BoardView = 'columns' | 'wall'

const VIEWS: { id: BoardView; label: string; Icon: typeof Columns3 }[] = [
  { id: 'columns', label: 'Columns', Icon: Columns3 },
  { id: 'wall', label: 'Wall', Icon: Hexagon },
]

export interface BoardHeaderProps {
  view: BoardView
  onViewChange: (view: BoardView) => void
  onAddPost: () => void
}

/**
 * The Board's header band. Title at display-lg / Fraunces 600 — not the hero's
 * 900, because the Board is the warm room and not the front door.
 */
export function BoardHeader({ view, onViewChange, onAddPost }: BoardHeaderProps) {
  return (
    <section data-section="board-header" className="bg-cream py-16">
      <div className="container-hive flex flex-wrap items-end justify-between gap-8">
        <div className="max-w-2xl">
          <SectionEyebrow>THE BOARD</SectionEyebrow>
          <h1 className="mt-3 font-display text-display-lg font-semibold opsz-display">
            The Board
          </h1>
          <p className="mt-4 text-body-lg text-ink/80">
            How the cohort keeps each other in the loop. High-fives, milestones, and what’s
            happening this week.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="tablist"
            aria-label="Board view"
            data-view-toggle=""
            className="inline-flex items-center gap-1 rounded-full border border-border bg-white p-1"
          >
            {VIEWS.map(({ id, label, Icon }) => {
              const active = view === id
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`board-view-${id}`}
                  aria-selected={active}
                  aria-controls="board-body"
                  data-view-tab={id}
                  onClick={() => onViewChange(id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 font-sans text-body-sm font-semibold transition-colors duration-200 ease-out',
                    active
                      ? 'bg-gold text-black'
                      : 'bg-transparent text-ink/70 hover:text-gold-deep',
                  )}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </button>
              )
            })}
          </div>

          <Button data-add-post-trigger="header" onClick={onAddPost}>
            <Plus size={18} aria-hidden="true" />
            Post to the board
          </Button>
        </div>
      </div>
    </section>
  )
}
