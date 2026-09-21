import { useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { SectionEyebrow } from '../components/SectionEyebrow'
import { tracks, trackIcons } from '../data/mock/tracks'

export default function ResourceTrack() {
  const { slug } = useParams<{ slug: string }>()
  const track = tracks.find((t) => t.slug === slug)

  if (!track) {
    return (
      <section className="container-hive section-rhythm">
        <EmptyState
          title="Track not found"
          message="That shelf doesn't exist — the hive is quiet over here."
          action={
            <Button to="/resources" variant="secondary" size="sm">
              Back to tracks
            </Button>
          }
        />
      </section>
    )
  }

  const Icon = trackIcons[track.iconName]

  return (
    <section className="container-hive section-rhythm">
      <SectionEyebrow>Resource track</SectionEyebrow>
      <Icon size={32} strokeWidth={1.75} className="mt-6 text-gold-deep" aria-hidden />
      <h1 className="mt-6 max-w-[18ch] font-display text-display-lg font-semibold opsz-display">
        {track.name}
      </h1>
      <p className="mt-4 text-body-lg font-medium text-gold-deep">{track.tagline}</p>
      <p className="mt-6 max-w-2xl text-body-lg text-ink">{track.description}</p>
      <p className="mt-10 max-w-xl text-body text-ink">
        Placeholder shell. Lessons, templates and downloads for this shelf are built in prompt 5.
      </p>
      <div className="mt-10">
        <Button to="/resources" variant="secondary" size="sm">
          All tracks
        </Button>
      </div>
    </section>
  )
}
