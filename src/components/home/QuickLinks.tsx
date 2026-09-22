import { Link } from 'react-router-dom'
import { BookOpen, MapPin, MessageSquare, Package } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Reveal } from '../Reveal'

interface Tile {
  title: string
  description: string
  to: string
  Icon: LucideIcon
}

const TILES: Tile[] = [
  {
    title: 'Community Guidelines',
    description: 'How we treat the space and each other.',
    to: '/space#guidelines',
    Icon: BookOpen,
  },
  {
    title: 'Feedback',
    description: 'Tell the HIVE team what is and is not working.',
    to: '/space#feedback',
    Icon: MessageSquare,
  },
  {
    title: 'Supplies',
    description: 'What is stocked, and how to ask for what is not.',
    to: '/space#supplies',
    Icon: Package,
  },
  {
    title: 'Space Info',
    description: 'Hours, badge access, and which room is which.',
    to: '/space#space-info',
    Icon: MapPin,
  },
]

export function QuickLinks() {
  return (
    <section data-section="quick-links" className="bg-cream py-16">
      <div className="container-hive">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TILES.map((tile, index) => (
            <Reveal as="li" key={tile.title} delay={index * 0.05}>
              <Link
                to={tile.to}
                data-quick-link={tile.title}
                className={
                  'flex h-full flex-col rounded-2xl border border-border bg-white p-6 ' +
                  'transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-md'
                }
              >
                <tile.Icon size={24} className="text-gold-deep" aria-hidden="true" />
                <h3 className="mt-4 font-sans text-body font-semibold text-black">{tile.title}</h3>
                <p className="mt-1 text-body-sm text-ink/70">{tile.description}</p>
              </Link>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-12 text-center">
          <Link
            to="/space#feedback"
            data-feedback-nudge=""
            className="font-display text-body-lg font-normal italic text-ink transition-colors duration-200 ease-out hover:text-gold-deep"
          >
            Has HIVE connected you with a person, resource, or idea this month? Tell us →
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
