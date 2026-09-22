import { byNewest, type BoardColumn, type BoardPost } from '../../data/mock/board-posts'

/**
 * Board filtering, in one place so the page and the Playwright suite agree on
 * what "this week" means instead of each having its own opinion.
 */

export type Timeframe = 'today' | 'week' | 'month' | 'all'

export const TIMEFRAMES: Timeframe[] = ['today', 'week', 'month', 'all']

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  today: 'Today',
  week: 'This week',
  month: 'This month',
  all: 'All time',
}

export type ColumnVisibility = Record<BoardColumn, boolean>

export interface BoardFilters {
  visibleColumns: ColumnVisibility
  /** Empty means every team. */
  selectedTeams: string[]
  timeframe: Timeframe
}

/**
 * Default timeframe is the month, not the week: a board that greets you with
 * two posts looks broken even when it is behaving.
 */
export const DEFAULT_FILTERS: BoardFilters = {
  visibleColumns: { 'high-five': true, milestones: true, 'this-week': true },
  selectedTeams: [],
  timeframe: 'month',
}

/** How many days back each timeframe reaches, measured from local midnight. */
const TIMEFRAME_DAYS: Record<Exclude<Timeframe, 'all'>, number> = {
  today: 0,
  week: 6,
  month: 29,
}

/**
 * Inclusive lower bound for a timeframe, as epoch ms. There is deliberately no
 * upper bound: mock timestamps are offsets from module load, so a post stamped
 * "today at 08:40" is briefly in the future when the suite runs at 07:00, and
 * an upper bound would make the filter — and therefore the tests — flap.
 */
export function timeframeCutoff(timeframe: Timeframe, now: Date = new Date()) {
  if (timeframe === 'all') return Number.NEGATIVE_INFINITY
  const midnight = new Date(now)
  midnight.setHours(0, 0, 0, 0)
  midnight.setDate(midnight.getDate() - TIMEFRAME_DAYS[timeframe])
  return midnight.getTime()
}

/** Every filter applied, newest first. Hidden columns drop out of the set. */
export function filterPosts(posts: BoardPost[], filters: BoardFilters, now?: Date) {
  const cutoff = timeframeCutoff(filters.timeframe, now)
  return posts
    .filter((post) => filters.visibleColumns[post.column])
    .filter((post) => filters.selectedTeams.length === 0 || filters.selectedTeams.includes(post.team))
    .filter((post) => new Date(post.timestamp).getTime() >= cutoff)
    .sort(byNewest)
}

/** True when the user has touched anything — drives the summary line. */
export function isFiltered(filters: BoardFilters) {
  return (
    filters.timeframe !== DEFAULT_FILTERS.timeframe ||
    filters.selectedTeams.length > 0 ||
    Object.values(filters.visibleColumns).some((visible) => !visible)
  )
}
