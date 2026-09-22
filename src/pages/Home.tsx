import { useCallback, useEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion'
import { Bee } from '../components/Bee'
import { Hero } from '../components/home/Hero'
import { WinsStrip } from '../components/home/WinsStrip'
import { NextUp } from '../components/home/NextUp'
import { BoardPreview } from '../components/home/BoardPreview'
import { Marquee } from '../components/home/Marquee'
import { QuickLinks } from '../components/home/QuickLinks'

const BEE_SIZE = 54

/**
 * Which side gutter the bee holds over each section.
 *
 * Chosen against the real content, not guessed:
 *  - `wins` is a full-bleed scroller whose cards overflow to the RIGHT, so the
 *    bee holds the left gutter there.
 *  - `partners` is an edge-to-edge marquee with no free gutter at all; the bee
 *    is simply passing through, and the band is ~200px of a ~3000px page.
 *  - Everything else is container-width (content stops 148px from each edge on
 *    a 1440 viewport), so both gutters are clear.
 *
 * Three side changes across six sections. More than that and the trail reads
 * as decoration rather than a route.
 */
const SECTION_SIDE: Record<string, 'left' | 'right'> = {
  hero: 'right',
  wins: 'left',
  'next-up': 'left',
  'board-preview': 'right',
  partners: 'right',
  // Quick links stays on the RIGHT and the route hooks left only in the final
  // sweep below the last tile. Crossing at the partners/quick-links seam
  // instead put the bee in the middle of the page at almost exactly 75%
  // scroll — one of the three depths the flight path is checked at, and a
  // place a reader's eye is genuinely mid-page.
  'quick-links': 'right',
}

/**
 * Clearance the bee needs on each side of itself inside a gutter.
 * Below this the flight path does not render at all — see hasGutter().
 */
const BEE_CLEARANCE = 6

/**
 * How far into the blank band between two sections the bee holds its gutter
 * before swinging across. At 0 the swing is spread over the whole band, which
 * looks lazy and leaves the bee near the middle of the page for a noticeable
 * stretch of scrolling; at 0.5 it would have no room to swing at all. 0.3
 * keeps the crossing to the middle ~40% of the band — fast, still smooth, and
 * entirely inside empty space.
 */
const PAD_BITE = 0.3

interface SectionBox {
  id: string
  /** Top of this section's actual content, i.e. inside its vertical padding. */
  contentTop: number
  contentBottom: number
}

interface Layout {
  w: number
  h: number
  /** Distance from the page edge to the first pixel of container content. */
  inset: number
  sections: SectionBox[]
}

interface Point {
  x: number
  y: number
}

/** Centre of the free gutter between the page edge and the container. */
function gutterX(layout: Layout, side: 'left' | 'right') {
  const x = layout.inset / 2
  return side === 'left' ? x : layout.w - x
}

/** Is there room for a bee out there at all? */
function hasGutter(layout: Layout) {
  return layout.inset >= BEE_SIZE + BEE_CLEARANCE * 2
}

/**
 * Waypoints: hold a gutter for the exact vertical span of each section's
 * CONTENT, and change sides in the blank band between one section's last
 * pixel of content and the next section's first.
 *
 * This is measured, not guessed. Anchoring at fractions of section height —
 * what prompt 1's fixed waypoints amounted to — put the swing over the hero's
 * copy column and through the middle of the events grid once real content
 * landed, because a section's padding is not a constant fraction of its
 * height. Padding bands are the only reliably empty horizontal strips on the
 * page, so they are where the bee crosses.
 */
function flightPathWaypoints(layout: Layout): Point[] {
  const { sections, h } = layout
  if (layout.w <= 0 || h <= 0 || sections.length === 0) return []

  const points: Point[] = []
  for (const [i, section] of sections.entries()) {
    const x = gutterX(layout, SECTION_SIDE[section.id] ?? 'right')
    const above = sections[i - 1]
    const below = sections[i + 1]
    // Reach up and down into the neighbouring padding bands, so the swing is
    // confined to the middle of each band rather than spread across all of it.
    const lead = above ? (section.contentTop - above.contentBottom) * PAD_BITE : 0
    const trail = below ? (below.contentTop - section.contentBottom) * PAD_BITE : 0
    points.push({ x, y: section.contentTop - Math.max(0, lead) })
    points.push({ x, y: section.contentBottom + Math.max(0, trail) })
  }

  // Enter above the first headline and leave below the last tile, so the route
  // reads as arriving and departing rather than starting mid-air.
  const first = points[0]
  const last = points[points.length - 1]
  points.unshift({ x: first.x, y: Math.max(8, first.y - 48) })
  // The route always ends bottom-left, whichever gutter the last section used.
  points.push({ x: gutterX(layout, 'left'), y: Math.min(h - 8, last.y + 48) })

  return points
}

/**
 * A cubic spline through the waypoints whose control points differ from their
 * anchors only vertically. That guarantees y increases monotonically along the
 * curve, which is what lets buildYLookup index the path by vertical position.
 */
function buildFlightPath(layout: Layout) {
  const points = flightPathWaypoints(layout)
  if (points.length < 2) return ''

  const n = (v: number) => +v.toFixed(2)
  const segments = [`M ${n(points[0].x)} ${n(points[0].y)}`]
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1]
    const to = points[i]
    const lift = (to.y - from.y) * 0.45
    segments.push(
      `C ${n(from.x)} ${n(from.y + lift)}, ${n(to.x)} ${n(to.y - lift)}, ${n(to.x)} ${n(to.y)}`,
    )
  }
  return segments.join(' ')
}

interface YLookup {
  total: number
  lengths: number[]
  ys: number[]
}

/**
 * Sample the curve once so we can convert a vertical position into a distance
 * along it cheaply on every scroll frame.
 */
function buildYLookup(path: SVGPathElement, samples = 320): YLookup {
  const total = path.getTotalLength()
  const lengths: number[] = []
  const ys: number[] = []
  for (let i = 0; i <= samples; i++) {
    const at = (i / samples) * total
    lengths.push(at)
    ys.push(path.getPointAtLength(at).y)
  }
  return { total, lengths, ys }
}

/** Distance along the curve at which it reaches targetY. */
function lengthAtY(lut: YLookup, targetY: number) {
  const { ys, lengths } = lut
  if (targetY <= ys[0]) return lengths[0]
  if (targetY >= ys[ys.length - 1]) return lengths[lengths.length - 1]
  let lo = 0
  let hi = ys.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (ys[mid] <= targetY) lo = mid
    else hi = mid
  }
  const span = ys[hi] - ys[lo]
  const t = span === 0 ? 0 : (targetY - ys[lo]) / span
  return lengths[lo] + t * (lengths[hi] - lengths[lo])
}

/**
 * One of the three sanctioned bee moments: the Home scroll flight-path.
 *
 * Two things here are load-bearing:
 *
 * 1. The curve is built from the MEASURED position of each section, not from
 *    fixed fractions of page height. With six sections of wildly different
 *    heights (an 88vh hero, a ~200px marquee) a fraction-based waypoint lands
 *    wherever it lands — which on this build meant straight through the middle
 *    of the events grid.
 * 2. The bee is positioned by VERTICAL progress rather than by distance along
 *    the curve. Arc length is distributed unevenly (the horizontal sweeps are
 *    long but barely descend), so driving off raw arc length lets the bee
 *    outrun the scroll and leave the viewport.
 */
export default function Home() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const lutRef = useRef<YLookup | null>(null)
  const [layout, setLayout] = useState<Layout>({ w: 0, h: 0, inset: 0, sections: [] })
  const reduceMotion = useReducedMotion()

  const measure = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const wrapTop = el.getBoundingClientRect().top

    // The gutter is whatever .container-hive leaves free, read off the DOM
    // rather than re-derived from the breakpoint maths — one source of truth.
    const container = el.querySelector<HTMLElement>('.container-hive')
    const inset = container
      ? container.getBoundingClientRect().left +
        parseFloat(getComputedStyle(container).paddingLeft)
      : 0

    const sections = [...el.querySelectorAll<HTMLElement>('[data-section]')].map((node) => {
      const children = [...node.children] as HTMLElement[]
      const rects = children.map((child) => child.getBoundingClientRect())
      const top = rects.length ? Math.min(...rects.map((r) => r.top)) : node.getBoundingClientRect().top
      const bottom = rects.length
        ? Math.max(...rects.map((r) => r.bottom))
        : node.getBoundingClientRect().bottom
      return {
        id: node.dataset.section ?? '',
        contentTop: Math.round(top - wrapTop),
        contentBottom: Math.round(bottom - wrapTop),
      }
    })

    setLayout({
      w: Math.round(el.clientWidth),
      h: Math.round(el.clientHeight),
      inset: Math.round(inset),
      sections,
    })
  }, [])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    // Observe the sections too: a wrapped headline or a late webfont changes
    // one section's height without changing the wrapper's width.
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    el.querySelectorAll('[data-section]').forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [measure])

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ['start start', 'end end'],
  })
  // Smooths the scrub without overshooting — no bounce.
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })

  const beeX = useMotionValue(0)
  const beeY = useMotionValue(0)
  const beeRotate = useMotionValue(0)
  const trail = useMotionValue(0)

  const d = hasGutter(layout) ? buildFlightPath(layout) : ''

  const placeBee = useCallback(
    (p: number) => {
      const path = pathRef.current
      const lut = lutRef.current
      if (!path || !lut || !lut.total) return

      const clamped = Math.min(Math.max(p, 0), 1)
      const targetY = lut.ys[0] + clamped * (lut.ys[lut.ys.length - 1] - lut.ys[0])
      const at = lengthAtY(lut, targetY)

      const point = path.getPointAtLength(at)
      const ahead = path.getPointAtLength(Math.min(at + 1, lut.total))
      beeX.set(point.x)
      beeY.set(point.y)
      // The bee artwork points up, so its heading is the tangent plus 90 degrees.
      beeRotate.set((Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI + 90)
      trail.set(at / lut.total)
    },
    [beeRotate, beeX, beeY, trail],
  )

  useMotionValueEvent(progress, 'change', placeBee)

  // Re-sample and re-place whenever the curve geometry changes (resize, or a
  // section growing as its content lands).
  useEffect(() => {
    const path = pathRef.current
    if (!path || !d) return
    lutRef.current = buildYLookup(path)
    placeBee(progress.get())
  }, [d, placeBee, progress])

  return (
    <div ref={wrapRef} className="relative">
      {d ? (
        <svg
          className="pointer-events-none absolute inset-0 z-10"
          width={layout.w}
          height={layout.h}
          viewBox={`0 0 ${layout.w} ${layout.h}`}
          fill="none"
          aria-hidden="true"
          data-flight-path=""
        >
          {/* Faint full-length guide, so the curve reads as a route. */}
          <path
            d={d}
            stroke="var(--gold-deep)"
            strokeOpacity={0.18}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="2 10"
          />
          {/* The trail the bee has actually flown. */}
          <motion.path
            ref={pathRef}
            d={d}
            stroke="var(--gold-deep)"
            strokeWidth={2}
            strokeLinecap="round"
            style={{ pathLength: reduceMotion ? 1 : trail }}
          />
          <motion.g style={{ x: beeX, y: beeY, rotate: beeRotate }}>
            <g transform={`translate(${-BEE_SIZE / 2}, ${-BEE_SIZE / 2})`}>
              <Bee size={BEE_SIZE} variant={reduceMotion ? 'static' : 'flying'} />
            </g>
          </motion.g>
        </svg>
      ) : null}

      <Hero />
      <WinsStrip />
      <NextUp />
      <BoardPreview />
      <Marquee />
      <QuickLinks />
    </div>
  )
}
