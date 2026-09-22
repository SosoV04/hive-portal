import { cn } from '../../lib/cn'

export type EventTypeVariant = 'internal' | 'cross-campus' | 'external'

/**
 * The 4px colour strip across the top of an event card. Shared with the
 * Schedule page so the colour key means the same thing in both places.
 *
 *   internal      gold       — HIVE's own events, in the HIVE space
 *   cross-campus  black      — co-hosted with another Purdue org
 *   external      gold-deep  — off-campus or run by a partner
 */
const BAR: Record<EventTypeVariant, string> = {
  internal: 'bg-gold',
  'cross-campus': 'bg-black',
  external: 'bg-gold-deep',
}

export const EVENT_TYPE_LABELS: Record<EventTypeVariant, string> = {
  internal: 'HIVE',
  'cross-campus': 'Cross-campus',
  external: 'External',
}

export function EventTypeBar({
  variant,
  className,
}: {
  variant: EventTypeVariant
  className?: string
}) {
  return (
    <div
      data-event-type={variant}
      aria-hidden="true"
      className={cn('h-1 w-full', BAR[variant], className)}
    />
  )
}
