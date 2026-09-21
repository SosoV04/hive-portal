import { Link } from 'react-router-dom'
import { Card } from '../components/Card'
import { Hex } from '../components/Hex'
import { SectionEyebrow } from '../components/SectionEyebrow'
import { tracks } from '../data/mock/tracks'

export default function Resources() {
  return (
    <section className="container-hive section-rhythm">
      <SectionEyebrow>Resources</SectionEyebrow>
      <h1 className="mt-3 font-display text-display-lg font-semibold opsz-display">Tracks</h1>
      <p className="mt-4 max-w-xl text-body-lg text-ink">
        Placeholder shell. Track contents, templates and downloads are built in prompt 5.
      </p>

      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.map((track, i) => (
          <li key={track.slug}>
            <Link to={`/resources/${track.slug}`} className="block h-full">
              <Card interactive className="flex h-full flex-col gap-4 p-6">
                {/* Category badge — a sanctioned hexagon use. */}
                <Hex size={44} variant="filled">
                  <span className="font-display text-body-sm font-black text-black">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </Hex>
                <h3 className="text-body-lg font-semibold text-black">{track.title}</h3>
                <p className="text-body-sm text-ink">{track.blurb}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
