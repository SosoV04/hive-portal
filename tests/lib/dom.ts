import type { Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/** Every route in the app, with the nav label that should go active. */
export const ROUTES = [
  { path: '/', label: 'Home', heading: "THIS WEEK'S FOUNDER" },
  { path: '/board', label: 'Board', heading: 'Board' },
  { path: '/schedule', label: 'Schedule', heading: 'Schedule' },
  { path: '/resources', label: 'Resources', heading: 'Ten shelves' },
  { path: '/directory', label: 'Directory', heading: 'Directory' },
  { path: '/space', label: null, heading: 'Space' },
] as const

export const NAV_LABELS = ['Home', 'Board', 'Schedule', 'Resources', 'Directory'] as const

/** The dev-only component probe page (never built into dist). */
export const PROBE_URL = 'tests/probe/probe.html'

const SHOT_DIR = path.join(process.cwd(), 'tests', '__screenshots__')

/**
 * Capture a screenshot on every run, not just on failure.
 *
 * The whole reason this harness exists is that looking at a rendered page
 * catches things assertions miss — detached SVG wings, a heading inheriting
 * the wrong font, a trail running straight through the copy. Keeping these
 * artifacts around means a human (or Claude) can review them after a green run.
 *
 * `name` may contain a directory, e.g. shot(page, 'home/hero-desktop').
 */
export async function shot(
  page: Page,
  name: string,
  options: { fullPage?: boolean; clip?: { x: number; y: number; width: number; height: number } } = {},
) {
  const file = path.join(SHOT_DIR, `${name}.png`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  await page.screenshot({ path: file, ...options })
}

/** Screenshot one section by its data-section id, at whatever the current viewport is. */
export async function shotSection(page: Page, section: string, name: string) {
  const el = page.locator(`[data-section="${section}"]`)
  await el.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  const file = path.join(SHOT_DIR, `${name}.png`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  await el.screenshot({ path: file })
}

/** Navigate to an app route and wait for webfonts, so type assertions are stable. */
export async function goto(page: Page, routePath: string) {
  const target = routePath.startsWith('/') ? routePath.slice(1) : routePath
  await page.goto(target, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
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

/** Failed network responses, so a dead image URL cannot pass as "rendered". */
export function collectFailedRequests(page: Page) {
  const failures: string[] = []
  page.on('response', (r) => {
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`)
  })
  page.on('requestfailed', (r) => failures.push(`failed ${r.url()}`))
  return failures
}
