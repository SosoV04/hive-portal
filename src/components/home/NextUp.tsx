import { Link } from 'react-router-dom'
import { Reveal } from '../Reveal'
import { SectionEyebrow } from '../SectionEyebrow'
import { EventCard } from '../shared/EventCard'
import { upcomingEvents } from '../../data/mock/events'

/** Home shows the next three; the Schedule page shows the rest. */
const PREVIEW_COUNT = 3

export function NextUp() {
  const next = upcomingEvents(PREVIEW_COUNT)

  return (
    <section data-section="next-up" className="bg-cream py-24">
      <div className="container-hive">
        <Reveal className="flex flex-wrap items-baseline justify-between gap-4">
          <SectionEyebrow>NEXT UP AT HIVE</SectionEyebrow>
          <Link
            to="/schedule"
            className="text-body-sm font-semibold text-ink transition-colors duration-200 ease-out hover:text-gold-deep"
          >
            See full schedule →
          </Link>
        </Reveal>

        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {next.map((event, index) => (
            <Reveal as="li" key={event.id} delay={index * 0.06} className="h-full">
              <EventCard event={event} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
