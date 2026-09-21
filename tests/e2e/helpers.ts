import type { Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * The locked palette, as the browser reports it from getComputedStyle.
 * If a token here stops matching :root in src/index.css, the design-system
 * spec fails — that is the point.
 */
export const TOKENS = {
  gold: 'rgb(207, 185, 145)',
  goldDeep: 'rgb(142, 111, 62)',
  goldSoft: 'rgb(237, 227, 206)',
  black: 'rgb(15, 15, 15)',
  ink: 'rgb(42, 38, 34)',
  cream: 'rgb(247, 244, 236)',
  white: 'rgb(255, 255, 255)',
  success: 'rgb(122, 139, 79)',
  warning: 'rgb(194, 94, 58)',
  border: 'rgb(229, 223, 209)',
} as const

/** Same values as hex, for asserting the CSS custom properties directly. */
export const TOKEN_HEX = {
  '--gold': '#cfb991',
  '--gold-deep': '#8e6f3e',
  '--gold-soft': '#ede3ce',
  '--black': '#0f0f0f',
  '--ink': '#2a2622',
  '--cream': '#f7f4ec',
  '--white': '#ffffff',
  '--success': '#7a8b4f',
  '--warning': '#c25e3a',
  '--border': '#e5dfd1',
} as const

/** Every route in the app, with the nav label that should go active. */
export const ROUTES = [
  { path: '/', label: 'Home', heading: 'Section 1' },
  { path: '/board', label: 'Board', heading: 'Board' },
  { path: '/schedule', label: 'Schedule', heading: 'Schedule' },
  { path: '/resources', label: 'Resources', heading: 'Ten shelves' },
  { path: '/directory', label: 'Directory', heading: 'Directory' },
  { path: '/space', label: null, heading: 'Space' },
] as const

export const NAV_LABELS = ['Home', 'Board', 'Schedule', 'Resources', 'Directory'] as const

/** The dev-only component probe page (never built into dist). */
export const PROBE_URL = 'tests/probe/probe.html'

const SHOT_DIR = path.join(process.cwd(), 'tests', 'e2e', 'screenshots')

/**
 * Capture a screenshot on every run, not just on failure.
 *
 * The whole reason this harness exists is that looking at a rendered page
 * catches things assertions miss — detached SVG wings, a heading inheriting
 * the wrong font, a trail running straight through the copy. Keeping these
 * artifacts around means a human (or Claude) can review them after a green run.
 */
export async function shot(page: Page, name: string) {
  fs.mkdirSync(SHOT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`) })
}

/** Navigate to an app route and wait for webfonts, so type assertions are stable. */
export async function goto(page: Page, routePath: string) {
  const target = routePath.startsWith('/') ? routePath.slice(1) : routePath
  await page.goto(target, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
}

/** Scroll to a fraction of the full page and let the spring settle. */
export async function scrollToFraction(page: Page, fraction: number, settleMs = 1200) {
  await page.evaluate((f) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo(0, max * f)
  }, fraction)
  await page.waitForTimeout(settleMs)
}

/** Collect console errors and uncaught exceptions for a page. */
export function collectPageErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  return errors
}
