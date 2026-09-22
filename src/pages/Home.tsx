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

const BEE_SIZE = 34

/**
 * Horizontal reach of the weave, in px. The desktop gutter is ~148px wide and
 * the bee flies down its centre line, so 40px each way stays clear of both the
 * page edge and the first pixel of container content.
 */
const WEAVE_AMPLITUDE = { desktop: 40, mobile: 24 }
const WEAVE_BREAKPOINT = 768

/** Full sine oscillations between one waypoint and the next. */
const WEAVE_OSCILLATIONS = 1.5

/**
 * Waypoint gaps shorter than this get proportionally less amplitude. The
 * crossing bands between two sections are only ~80px tall, and a full-width
 * weave across one reads as a scribble rather than a flight.
 */
const WEAVE_FULL_SPAN = 260

/** Target spacing, in px, between samples when flattening the curve. */
const WEAVE_SAMPLE_PX = 5

/**
 * The bee never pitches past this. The route descends far more than it
 * wanders, so the raw tangent is close to straight down almost everywhere —
 * unclamped it would fly nose-first into the footer.
 */
const MAX_TILT = 20

/** Arc length either side of the bee used to read the path's heading. */
const TANGENT_SPAN = 10

/** Idle hover: amplitude in px and period in seconds. */
const BOB_PX = 3
const BOB_S = 2.4

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

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number) {
  const m = 1 - t
  return m * m * m * p0 + 3 * m * m * t * p1 + 3 * m * t * t * p2 + t * t * t * p3
}

/**
 * Sideways displacement of the weave at a given y.
 *
 * It is pinned to zero at every waypoint, so the route still threads the
 * gutters those waypoints were measured for — the weave rides on the spline
 * rather than replacing it. The sin(pi*u) envelope flattens the slope to zero
 * there too, which is what keeps each pass-through smooth instead of
 * cornering, and lets neighbouring gaps carry different amplitudes without
 * showing a seam.
 */
function weaveOffset(y: number, anchors: number[], amplitude: number) {
  for (let i = 0; i < anchors.length - 1; i++) {
    const top = anchors[i]
    const bottom = anchors[i + 1]
    if (y < top || y > bottom) continue
    const span = bottom - top
    if (span <= 0) return 0
    const u = (y - top) / span
    const envelope = Math.sin(Math.PI * u)
    const taper = Math.min(1, span / WEAVE_FULL_SPAN)
    return amplitude * taper * envelope * Math.sin(2 * Math.PI * WEAVE_OSCILLATIONS * u)
  }
  return 0
}

/**
 * A cubic spline through the waypoints whose control points differ from their
 * anchors only vertically, flattened to a polyline and woven sideways.
 *
 * The vertical-only control points guarantee y increases monotonically along
 * the curve, which is what lets buildYLookup index the path by vertical
 * position; the weave only ever displaces x, so that property survives it.
 * Sampling is proportional to each gap's height rather than a fixed step
 * count, because the short crossing bands carry the tightest oscillation and
 * would otherwise come out visibly faceted.
 */
function buildFlightPath(layout: Layout) {
  const points = flightPathWaypoints(layout)
  if (points.length < 2) return ''

  const amplitude =
    layout.w >= WEAVE_BREAKPOINT ? WEAVE_AMPLITUDE.desktop : WEAVE_AMPLITUDE.mobile
  const anchors = points.map((point) => point.y)
  const n = (v: number) => +v.toFixed(2)

  const out: string[] = []
  const push = (x: number, y: number) =>
    out.push(`${n(x + weaveOffset(y, anchors, amplitude))} ${n(y)}`)

  push(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1]
    const to = points[i]
    const lift = (to.y - from.y) * 0.45
    const steps = Math.max(8, Math.min(240, Math.round((to.y - from.y) / WEAVE_SAMPLE_PX)))
    for (let step = 1; step <= steps; step++) {
      const t = step / steps
      push(
        cubicAt(from.x, from.x, to.x, to.x, t),
        cubicAt(from.y, from.y + lift, to.y - lift, to.y, t),
      )
    }
  }
  return `M ${out[0]} L ${out.slice(1).join(' L ')}`
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

  // Which way the bee faces. Held in state rather than a motion value because
  // it swaps the artwork, but it only changes when the weave reverses — a
  // handful of re-renders across the whole scroll, not one per frame.
  const [facing, setFacing] = useState<'left' | 'right'>('right')
  const facingRef = useRef<'left' | 'right'>('right')

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
      // Read the heading across a span rather than off a single polyline facet.
      const back = path.getPointAtLength(Math.max(at - TANGENT_SPAN, 0))
      const ahead = path.getPointAtLength(Math.min(at + TANGENT_SPAN, lut.total))
      const dx = ahead.x - back.x
      const dy = ahead.y - back.y

      beeX.set(point.x)
      beeY.set(point.y)

      // The artwork flies horizontally, so the bee mirrors to face its travel
      // direction and only pitches by the descent angle. Clamping that pitch is
      // what stops a near-vertical stretch of the weave reading as a dive.
      const next = dx >= 0 ? 'right' : 'left'
      if (next !== facingRef.current) {
        facingRef.current = next
        setFacing(next)
      }
      const pitch = (Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI
      const clampedPitch = Math.min(Math.max(pitch, -MAX_TILT), MAX_TILT)
      beeRotate.set(next === 'right' ? clampedPitch : -clampedPitch)

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
            strokeDasharray="2 6"
          />
          {/* The trail the bee has actually flown — flight dust, not stitching. */}
          <motion.path
            ref={pathRef}
            d={d}
            stroke="var(--gold-deep)"
            strokeOpacity={0.35}
            strokeWidth={2}
            strokeLinecap="round"
            style={{ pathLength: reduceMotion ? 1 : trail }}
          />
          <motion.g style={{ x: beeX, y: beeY, rotate: beeRotate }}>
            {/*
              The idle hover sits on its own group so the outer transform stays
              purely scroll-driven. Under reduced motion it collapses to a plain
              <g> — no residual transform for the bee to sit on.
            */}
            {reduceMotion ? (
              <g data-bee-bob="">
                <g transform={`translate(${-BEE_SIZE / 2}, ${-BEE_SIZE / 2})`}>
                  <Bee size={BEE_SIZE} variant="static" direction={facing} />
                </g>
              </g>
            ) : (
              <motion.g
                data-bee-bob=""
                animate={{ y: [-BOB_PX, BOB_PX, -BOB_PX] }}
                transition={{ duration: BOB_S, repeat: Infinity, ease: 'easeInOut' }}
              >
                <g transform={`translate(${-BEE_SIZE / 2}, ${-BEE_SIZE / 2})`}>
                  <Bee size={BEE_SIZE} variant="flying" direction={facing} />
                </g>
              </motion.g>
            )}
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
