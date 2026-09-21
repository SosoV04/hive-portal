import { useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { SectionEyebrow } from '../components/SectionEyebrow'
import { tracks } from '../data/mock/tracks'

export default function ResourceTrack() {
  const { slug } = useParams<{ slug: string }>()
  const track = tracks.find((t) => t.slug === slug)

  if (!track) {
    return (
      <section className="container-hive section-rhythm">
        <EmptyState
          title="Track not found"
          message="That resource track doesn't exist — the hive is quiet over here."
          action={
            <Button to="/resources" variant="secondary" size="sm">
              Back to tracks
            </Button>
          }
        />
      </section>
    )
  }

  return (
    <section className="container-hive section-rhythm">
      <SectionEyebrow>Resource track</SectionEyebrow>
      <h1 className="mt-3 font-display text-display-lg font-semibold opsz-display">
        {track.title}
      </h1>
      <p className="mt-4 max-w-xl text-body-lg text-ink">{track.blurb}</p>
      <p className="mt-8 max-w-xl text-body text-ink">
        Placeholder shell. Lessons, templates and downloads for this track are built in prompt 5.
      </p>
      <div className="mt-8">
        <Button to="/resources" variant="secondary" size="sm">
          All tracks
        </Button>
      </div>
    </section>
  )
}
