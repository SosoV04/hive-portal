import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { ColumnDot } from '../shared/ColumnDot'
import { cn } from '../../lib/cn'
import { BOARD_COLUMNS, type BoardColumn } from '../../data/mock/board-posts'
import { COLUMN_TITLES } from './columns'
import {
  TIMEFRAMES,
  TIMEFRAME_LABELS,
  type BoardFilters,
  type Timeframe,
} from './filters'
import { useDismiss } from './useDismiss'

export interface FilterBarProps {
  filters: BoardFilters
  teams: string[]
  /** Posts passing the filters, and the total in state. */
  shown: number
  total: number
  dirty: boolean
  onToggleColumn: (column: BoardColumn) => void
  onToggleTeam: (team: string) => void
  onClearTeams: () => void
  onTimeframe: (timeframe: Timeframe) => void
  onClear: () => void
}

const PILL =
  'inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-2 ' +
  'font-sans text-body-sm font-medium text-ink transition-colors duration-200 ease-out ' +
  'hover:border-gold hover:text-gold-deep'

function Dropdown({
  id,
  label,
  active,
  align = 'left',
  children,
}: {
  id: string
  label: string
  active: boolean
  /** Which edge the menu hangs from — 'right' keeps it inside the gutter. */
  align?: 'left' | 'right'
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  useDismiss(open, () => setOpen(false), wrap)

  return (
    <div className="relative" ref={wrap}>
      <button
        type="button"
        data-filter-trigger={id}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
        className={cn(PILL, active && 'border-gold bg-gold-soft text-gold-deep')}
      >
        {label}
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {open ? (
        <div
          data-filter-menu={id}
          className={cn(
            'absolute z-30 mt-2 max-h-72 w-52 overflow-y-auto rounded-xl border border-border bg-white py-1 shadow-md',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  )
}

const MENU_ITEM =
  'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-body-sm ' +
  'text-ink transition-colors duration-200 ease-out hover:bg-gold-soft hover:text-gold-deep'

/**
 * Sticky filter bar.
 *
 * `top: 73px`, not 72: the nav's sticky row is 72px tall PLUS its 1px bottom
 * border, so a bar parked at 72 sits on top of that border and hides it. 73 is
 * where the two sticky layers meet exactly. The bar also publishes its own
 * height as --board-filter-h, so the Columns view can stick its column headers
 * directly below it however many lines the filter summary is taking.
 */
export function FilterBar({
  filters,
  teams,
  shown,
  total,
  dirty,
  onToggleColumn,
  onToggleTeam,
  onClearTeams,
  onTimeframe,
  onClear,
}: FilterBarProps) {
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bar.current
    if (!el) return
    const publish = () => {
      document.documentElement.style.setProperty('--board-filter-h', `${el.offsetHeight}px`)
    }
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(el)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--board-filter-h')
    }
  }, [])

  const teamLabel =
    filters.selectedTeams.length === 0
      ? 'All teams'
      : filters.selectedTeams.length === 1
        ? '1 team'
        : `${filters.selectedTeams.length} teams`

  return (
    <div
      ref={bar}
      data-filter-bar=""
      className="sticky z-30 border-b border-border bg-white"
      // Inline, not an arbitrary Tailwind value: this offset is shared with
      // ColumnsView's header offset, and reads better as a number than as
      // top-[73px] in a class string.
      style={{ top: 73 }}
    >
      <div className="container-hive flex flex-wrap items-center gap-x-6 gap-y-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {BOARD_COLUMNS.map((column) => {
            const on = filters.visibleColumns[column]
            return (
              <button
                key={column}
                type="button"
                role="checkbox"
                aria-checked={on}
                data-column-chip={column}
                onClick={() => onToggleColumn(column)}
                className={cn(
                  'group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 font-sans text-body-sm font-medium transition-colors duration-200 ease-out',
                  on
                    ? 'border-gold bg-gold-soft text-black'
                    : 'border-border bg-white text-ink/50 hover:border-gold hover:text-ink',
                )}
              >
                <ColumnDot column={column} className={cn(!on && 'opacity-30')} />
                {COLUMN_TITLES[column]}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 md:mx-auto">
          <Dropdown id="teams" label={teamLabel} active={filters.selectedTeams.length > 0}>
            {() => (
              <>
                <button
                  type="button"
                  data-team-option="__all"
                  onClick={onClearTeams}
                  className={cn(MENU_ITEM, 'font-semibold')}
                >
                  All teams
                  {filters.selectedTeams.length === 0 ? (
                    <Check size={14} aria-hidden="true" />
                  ) : null}
                </button>
                {teams.map((team) => {
                  const on = filters.selectedTeams.includes(team)
                  return (
                    <button
                      key={team}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      data-team-option={team}
                      onClick={() => onToggleTeam(team)}
                      className={MENU_ITEM}
                    >
                      {team}
                      {on ? <Check size={14} aria-hidden="true" /> : null}
                    </button>
                  )
                })}
              </>
            )}
          </Dropdown>
        </div>

        <div className="flex items-center gap-2 md:ml-auto">
          <Dropdown
            id="timeframe"
            label={TIMEFRAME_LABELS[filters.timeframe]}
            active={filters.timeframe !== 'month'}
            align="right"
          >
            {(close) =>
              TIMEFRAMES.map((timeframe) => (
                <button
                  key={timeframe}
                  type="button"
                  data-timeframe-option={timeframe}
                  aria-current={filters.timeframe === timeframe}
                  onClick={() => {
                    onTimeframe(timeframe)
                    close()
                  }}
                  className={MENU_ITEM}
                >
                  {TIMEFRAME_LABELS[timeframe]}
                  {filters.timeframe === timeframe ? (
                    <Check size={14} aria-hidden="true" />
                  ) : null}
                </button>
              ))
            }
          </Dropdown>
        </div>
      </div>

      {dirty ? (
        <div className="container-hive pb-2.5">
          <p data-filter-summary="" className="text-body-sm text-ink/60">
            Showing {shown} of {total} posts{' '}
            <span aria-hidden="true" className="px-1">
              •
            </span>
            <button
              type="button"
              data-clear-filters=""
              onClick={onClear}
              className="underline decoration-gold-deep/50 underline-offset-2 transition-colors duration-200 ease-out hover:text-gold-deep"
            >
              Clear filters
            </button>
          </p>
        </div>
      ) : null}

      {/* Screen readers hear the count change even when the summary is hidden. */}
      <p aria-live="polite" data-filter-live="" className="sr-only">
        Showing {shown} of {total} posts
      </p>
    </div>
  )
}
