import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion'
import { Bee } from '../components/Bee'

const BEE_SIZE = 54

const SECTIONS = [
  { label: 'Section 1', note: 'Hero placeholder', tone: 'bg-black/[0.04]' },
  { label: 'Section 2', note: 'Wins placeholder', tone: 'bg-black/[0.09]' },
  { label: 'Section 3', note: 'Events placeholder', tone: 'bg-black/[0.04]' },
]

/**
 * Weaving curve from the top-right of section 1 down to the bottom-left of
 * section 3. Built in raw pixels so the SVG viewBox can match the container
 * 1:1 — that keeps the bee from being distorted by non-uniform scaling.
 *
 * Two constraints shape the waypoints:
 *  - The bee sits near a side gutter at each section's midpoint
 *    (y = 0.167 / 0.5 / 0.833) and crosses the middle at the section
 *    boundaries, so the trail avoids wherever centered content will go.
 *  - y increases monotonically, which is what lets us look up a point on the
 *    curve by vertical position (see buildYLookup).
 */
export function buildFlightPath(w: number, h: number) {
  if (w <= 0 || h <= 0) return ''
  const x = (f: number) => +(f * w).toFixed(2)
  const y = (f: number) => +(f * h).toFixed(2)
  return [
    `M ${x(0.88)} ${y(0.05)}`,
    // Section 1: hold the right gutter, then cross at the first boundary.
    `C ${x(0.92)} ${y(0.15)}, ${x(0.8)} ${y(0.26)}, ${x(0.5)} ${y(0.33)}`,
    // Section 2: settle into the left gutter.
    `C ${x(0.28)} ${y(0.385)}, ${x(0.14)} ${y(0.42)}, ${x(0.14)} ${y(0.5)}`,
    // Cross back at the second boundary.
    `C ${x(0.14)} ${y(0.57)}, ${x(0.3)} ${y(0.61)}, ${x(0.45)} ${y(0.65)}`,
    // Section 3: back out to the right gutter.
    `C ${x(0.62)} ${y(0.7)}, ${x(0.8)} ${y(0.75)}, ${x(0.8)} ${y(0.83)}`,
    // Final sweep to bottom-left, below the third section's content.
    `C ${x(0.8)} ${y(0.9)}, ${x(0.4)} ${y(0.945)}, ${x(0.12)} ${y(0.95)}`,
  ].join(' ')
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
function buildYLookup(path: SVGPathElement, samples = 240): YLookup {
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
 * The bee is positioned by VERTICAL progress rather than by distance along the
 * curve. Arc length is distributed unevenly (the horizontal sweeps are long
 * but barely descend), so driving off raw arc length lets the bee outrun the
 * scroll and leave the viewport. Mapping through y keeps it pinned to the
 * reader, and the trail is drawn to exactly the bee's own distance so the two
 * can never drift apart.
 */
export default function Home() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const lutRef = useRef<YLookup | null>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setDims({ w: Math.round(width), h: Math.round(height) })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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

  const d = buildFlightPath(dims.w, dims.h)

  function placeBee(p: number) {
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
  }

  useMotionValueEvent(progress, 'change', placeBee)

  // Re-sample and re-place whenever the curve geometry changes (resize).
  useEffect(() => {
    const path = pathRef.current
    if (!path || !d) return
    lutRef.current = buildYLookup(path)
    placeBee(progress.get())
  }, [d]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={wrapRef} className="relative">
      {dims.w > 0 ? (
        <svg
          className="pointer-events-none absolute inset-0 z-10"
          width={dims.w}
          height={dims.h}
          viewBox={`0 0 ${dims.w} ${dims.h}`}
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

      {SECTIONS.map((section) => (
        <section
          key={section.label}
          className={`flex h-screen flex-col items-center justify-center ${section.tone}`}
        >
          <h2 className="font-display text-display-lg font-semibold opsz-display">
            {section.label}
          </h2>
          <p className="mt-3 text-body-lg text-ink">{section.note}</p>
        </section>
      ))}
    </div>
  )
}
