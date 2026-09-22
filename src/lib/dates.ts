/**
 * Date helpers for the mock data.
 *
 * Every mock timestamp is expressed as an offset from the moment the module
 * loads, not as a literal date. A hard-coded "2026-09-18" reads fine this week
 * and reads like a dead demo next semester — wins would drift out of the
 * "last three weeks" window and the Schedule would fill with events that
 * already happened. Offsets keep the portal looking alive whenever someone
 * opens it, which is the whole premise of the Home page.
 */

const DAY = 24 * 60 * 60 * 1000

/** Local midnight today — the anchor every mock offset is measured from. */
function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** ISO timestamp for `days` in the future at `hour`:`minute` local time. */
export function inDays(days: number, hour = 9, minute = 0) {
  const d = startOfToday()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

/** ISO timestamp for `days` ago at `hour`:`minute` local time. */
export function daysAgo(days: number, hour = 9, minute = 0) {
  return inDays(-days, hour, minute)
}

/**
 * Today at `hour`:`minute`, but never in the future — if that time has not
 * come round yet, the stamp lands half a minute ago instead.
 *
 * Board posts stamped "today" need both halves of that: inside the Board's
 * Today filter whenever the page is opened, and never rendered as "in 5
 * hours", which is what a fixed morning hour does to anyone reading at dawn.
 */
export function todayAt(hour: number, minute = 0) {
  const wanted = new Date(inDays(0, hour, minute)).getTime()
  return new Date(Math.min(wanted, Date.now() - 30_000)).toISOString()
}

/**
 * The next calendar date whose weekday matches `weekday` (0 = Sunday), at
 * least `after` days out. Keeps "Thursday dinner" on a Thursday forever.
 */
export function nextWeekday(weekday: number, after = 1, hour = 9, minute = 0) {
  const base = startOfToday()
  base.setDate(base.getDate() + after)
  const shift = (weekday - base.getDay() + 7) % 7
  return inDays(after + shift, hour, minute)
}

const RELATIVE_STEPS: [limit: number, unit: Intl.RelativeTimeFormatUnit, ms: number][] = [
  [60_000, 'second', 1000],
  [3_600_000, 'minute', 60_000],
  [86_400_000, 'hour', 3_600_000],
  [2_592_000_000, 'day', DAY],
]

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** "3 days ago", "yesterday", "2 hours ago". Used on wins and board posts. */
export function timeAgo(iso: string, now = Date.now()) {
  const delta = new Date(iso).getTime() - now
  const magnitude = Math.abs(delta)
  for (const [limit, unit, ms] of RELATIVE_STEPS) {
    if (magnitude < limit) return relative.format(Math.round(delta / ms), unit)
  }
  return relative.format(Math.round(delta / (7 * DAY)), 'week')
}

/**
 * Compact relative stamp for Board post cards: "2h ago", "yesterday", "3d ago".
 *
 * Separate from timeAgo() on purpose — the Board's timestamp sits at the far
 * right of a card's top row, where "3 days ago" wraps and "3d ago" does not.
 * Future timestamps read as "just now": mock offsets are taken from module
 * load, so a post stamped for later today is briefly ahead of the clock.
 */
export function timeAgoShort(iso: string, now = Date.now()) {
  const delta = now - new Date(iso).getTime()
  if (delta < 60_000) return 'just now'
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m ago`
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h ago`
  const days = Math.round(delta / DAY)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return `${Math.round(days / 30)}mo ago`
}

const DAY_NAME = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
const MONTH_DAY = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const CLOCK = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

/** "Thu" — the day-of-week caption on an event card. */
export function weekdayLabel(iso: string) {
  return DAY_NAME.format(new Date(iso)).toUpperCase()
}

/** "Oct 2" — the date block on an event card. */
export function dateLabel(iso: string) {
  return MONTH_DAY.format(new Date(iso))
}

/** "6:30 PM – 8:00 PM", or just the start time when there is no end. */
export function timeRangeLabel(startIso: string, endIso?: string) {
  const start = CLOCK.format(new Date(startIso))
  return endIso ? `${start} – ${CLOCK.format(new Date(endIso))}` : start
}
