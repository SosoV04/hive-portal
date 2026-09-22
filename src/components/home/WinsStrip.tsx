import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Hex } from '../Hex'
import { Reveal } from '../Reveal'
import { SectionEyebrow } from '../SectionEyebrow'
import { wins } from '../../data/mock/wins'
import { timeAgo } from '../../lib/dates'

const CARD_WIDTH = 320
const CARD_GAP = 24

/**
 * Recent wins — a horizontal scroller on a gold-soft band.
 *
 * Scroll-snap only: no carousel library and no auto-advance. Wins are the one
 * thing on the page a member might actually read all of, and nothing is more
 * annoying than a card sliding away mid-sentence.
 */
export function WinsStrip() {
  const trackRef = useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const syncEdges = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 1)
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1)
  }, [])

  useEffect(syncEdges, [syncEdges])

  function scrollBy(direction: -1 | 1) {
    trackRef.current?.scrollBy({
      left: direction * (CARD_WIDTH + CARD_GAP),
      behavior: 'smooth',
    })
  }

  const chevron =
    'hidden h-10 w-10 items-center justify-center rounded-full border border-border bg-white ' +
    'text-ink transition-colors duration-200 ease-out hover:border-gold-deep hover:text-gold-deep ' +
    'disabled:cursor-not-allowed disabled:opacity-40 md:inline-flex'

  return (
    <section data-section="wins" className="bg-gold-soft py-16">
      <div className="container-hive">
        <Reveal className="flex items-center justify-between gap-6">
          <SectionEyebrow>RECENT WINS</SectionEyebrow>
          {/* Touch handles this on mobile, so the chevrons are desktop-only. */}
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Scroll wins left"
              onClick={() => scrollBy(-1)}
              disabled={atStart}
              className={chevron}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Scroll wins right"
              onClick={() => scrollBy(1)}
              disabled={atEnd}
              className={chevron}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </Reveal>
      </div>

      {/*
        The track is full-bleed rather than inside the container: a scroller
        that stops at the container edge looks broken the moment it overflows.
        Padding matches the container gutters so card 1 lines up with the
        eyebrow above it.
      */}
      <ul
        ref={trackRef}
        onScroll={syncEdges}
        data-wins-track=""
        className="scroller-gutter mt-6 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4"
      >
        {wins.map((win) => (
          <li
            key={win.id}
            data-win-card={win.id}
            className="flex w-[320px] shrink-0 snap-start flex-col rounded-2xl border border-border bg-white p-6"
          >
            <div className="flex items-center gap-3">
              <Hex size={56} variant="filled" color="var(--gold-soft)">
                <span className="font-display text-[0.8rem] font-black leading-none text-gold-deep">
                  {win.teamInitials}
                </span>
              </Hex>
              <div className="min-w-0">
                <p className="truncate text-body font-semibold text-black">{win.teamName}</p>
                <p className="text-caption uppercase text-ink/50">{timeAgo(win.postedAt)}</p>
              </div>
            </div>

            <p className="mt-5 flex-1 text-body-lg text-ink">{win.body}</p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full bg-success"
              />
              <span className="font-sans text-caption font-semibold uppercase text-success">
                {win.kind}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
