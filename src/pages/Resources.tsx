import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '../components/Card'
import { SectionEyebrow } from '../components/SectionEyebrow'
import { tracks, trackIcons } from '../data/mock/tracks'

export default function Resources() {
  return (
    <section className="container-hive section-rhythm">
      <SectionEyebrow>Resources</SectionEyebrow>
      <h1 className="mt-3 max-w-[16ch] font-display text-display-lg font-semibold opsz-display">
        Ten shelves, one workshop.
      </h1>
      <p className="mt-6 max-w-xl text-body-lg text-ink">
        Every track is a shelf of things other founders wished they had known sooner. Pull down
        whichever one matches the problem in front of you.
      </p>

      <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.map((track, i) => {
          const Icon = trackIcons[track.iconName]
          return (
            <motion.li
              key={track.slug}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: (i % 3) * 0.05 }}
            >
              <Link to={`/resources/${track.slug}`} className="block h-full">
                <Card interactive className="flex h-full flex-col p-8">
                  <Icon size={24} strokeWidth={1.75} className="text-gold-deep" aria-hidden />
                  <h2 className="mt-6 font-display text-[1.375rem] font-semibold leading-snug text-black">
                    {track.name}
                  </h2>
                  <p className="mt-2 text-body-sm font-medium text-gold-deep">{track.tagline}</p>
                  <p className="mt-4 text-body-sm text-ink">{track.description}</p>
                </Card>
              </Link>
            </motion.li>
          )
        })}
      </ul>
    </section>
  )
}
