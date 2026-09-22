import { CalendarPlus } from 'lucide-react'
import { Card } from '../Card'
import { Hex } from '../Hex'
import { EventTypeBar } from './EventTypeBar'
import type { HiveEvent } from '../../data/mock/events'
import { dateLabel, timeRangeLabel, weekdayLabel } from '../../lib/dates'
import { cn } from '../../lib/cn'

/**
 * One event. Used in the Home "Next up" grid and, from prompt 4, on the
 * Schedule page — which is why it lives in shared/ rather than home/.
 */
export function EventCard({ event, className }: { event: HiveEvent; className?: string }) {
  return (
    <Card
      data-event-card={event.id}
      className={cn('flex h-full flex-col overflow-hidden', className)}
    >
      <EventTypeBar variant={event.type} />

      <div className="flex flex-1 flex-col p-6">
        <p className="font-sans text-caption font-semibold uppercase text-gold-deep">
          {weekdayLabel(event.starts)}
        </p>
        {/* Date block is display type — it is the thing people scan for. */}
        <p className="mt-1 font-display text-display-md font-semibold text-black opsz-display">
          {dateLabel(event.starts)}
        </p>

        <h3 className="mt-4 font-sans text-body-lg font-semibold text-black">{event.title}</h3>

        <p className="mt-2 text-body-sm text-ink/70">
          {timeRangeLabel(event.starts, event.ends)} · {event.location}
        </p>

        <div className="mt-4 flex items-center gap-2.5">
          <Hex size={32} variant="filled" color="var(--gold-soft)">
            <span className="font-display text-[0.6rem] font-black leading-none text-gold-deep">
              {event.hostInitials}
            </span>
          </Hex>
          <span className="text-body-sm text-ink">{event.hostName}</span>
        </div>

        {/* Buttons pin to the bottom so a three-card row lines up. */}
        <div className="mt-auto flex items-center gap-4 pt-6">
          <button
            type="button"
            className={
              'inline-flex items-center justify-center rounded-full border border-black px-4 py-2 ' +
              'font-sans text-body-sm font-semibold text-black transition-colors duration-200 ' +
              'ease-out hover:bg-black hover:text-cream'
            }
          >
            RSVP
          </button>
          <button
            type="button"
            className={
              'inline-flex items-center gap-1.5 font-sans text-body-sm font-semibold text-ink ' +
              'transition-colors duration-200 ease-out hover:text-gold-deep'
            }
          >
            <CalendarPlus size={16} aria-hidden="true" />
            Add to calendar
          </button>
        </div>
      </div>
    </Card>
  )
}
