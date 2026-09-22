import type { Page } from '@playwright/test'

/**
 * Motion-safe waits.
 *
 * Everything on this site animates on a 200-400ms ease, and the Home
 * flight-path is spring-smoothed on top of that. Asserting a position
 * immediately after a scroll reads a half-settled value, so these helpers own
 * the settle time in one place instead of scattering waitForTimeout calls.
 */

/** Longest single transition in the design system, plus headroom. */
export const SETTLE_MS = 600

/** The scroll spring (stiffness 120, damping 30) needs longer than a transition. */
export const SPRING_SETTLE_MS = 1200

/** Wait for two animation frames — enough for a layout/transform to commit. */
export async function nextFrames(page: Page, count = 2) {
  await page.evaluate(async (n) => {
    for (let i = 0; i < n; i++) {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
  }, count)
}

/** Scroll to a fraction of the full page and let the spring settle. */
export async function scrollToFraction(page: Page, fraction: number, settleMs = SPRING_SETTLE_MS) {
  await page.evaluate((f) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo(0, max * f)
  }, fraction)
  await page.waitForTimeout(settleMs)
}

/**
 * Bring an element into view and wait for its whileInView reveal to finish.
 * Reveals are 400ms; the extra headroom covers the IntersectionObserver tick.
 */
export async function revealInView(page: Page, selector: string, settleMs = SETTLE_MS) {
  await page.evaluate((sel) => {
    document.querySelector(sel)?.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior })
  }, selector)
  await page.waitForTimeout(settleMs)
}

/**
 * Run a block with prefers-reduced-motion: reduce, then restore.
 * Reduced motion must be set before navigation, so callers normally emulate
 * and then goto inside the block.
 */
export async function withReducedMotion(page: Page, run: () => Promise<void>) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  try {
    await run()
  } finally {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  }
}
