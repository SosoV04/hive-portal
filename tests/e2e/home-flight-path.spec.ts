import { expect, test } from '@playwright/test'
import { goto, scrollToFraction, shot } from './helpers'

/**
 * The Home scroll flight-path is the most mechanically delicate thing on the
 * site, so it gets the most scrutiny. Two regressions already happened here:
 * the bee outrunning the scroll and leaving the viewport, and the trail
 * running straight through centred copy.
 */

interface Sample {
  beeX: number
  beeY: number
  viewportY: number
  drawn: number
  transform: string
}

async function sample(page: import('@playwright/test').Page): Promise<Sample> {
  return page.evaluate(() => {
    const svg = document.querySelector('[data-flight-path]')!
    const bee = document.querySelector('[data-bee]')!
    const group = svg.querySelector('g')!
    const box = bee.getBoundingClientRect()
    const svgBox = svg.getBoundingClientRect()
    // framer-motion drives pathLength by setting pathLength="1" and writing
    // stroke-dasharray in those normalised units, so the first dash value is
    // the fraction of the trail currently painted.
    const trail = [...svg.querySelectorAll('path')][1]
    const dash = trail.getAttribute('stroke-dasharray')
    return {
      beeX: Math.round(box.x + box.width / 2 - svgBox.x),
      beeY: Math.round(box.y + box.height / 2 - svgBox.y),
      viewportY: Math.round(box.y + box.height / 2),
      // No dasharray at all means the trail is painted solid, i.e. complete.
      drawn: dash ? parseFloat(dash.split(/[ ,]+/)[0]) : 1,
      transform: (group as SVGElement).style.transform ?? '',
    }
  })
}

test.describe('home scroll flight-path', () => {
  test('three full-height sections with the path overlaid', async ({ page }) => {
    await goto(page, '/')
    const sections = page.locator('main section')
    await expect(sections).toHaveCount(3)

    const heights = await page.evaluate(() => {
      const vh = window.innerHeight
      return [...document.querySelectorAll('main section')].map(
        (s) => Math.round(s.getBoundingClientRect().height) === vh,
      )
    })
    expect(heights).toEqual([true, true, true])

    const svgHeight = await page.locator('[data-flight-path]').evaluate(
      (el) => el.getBoundingClientRect().height / window.innerHeight,
    )
    expect(svgHeight).toBeGreaterThan(2.5)
  })

  test('the bee flies top-right to bottom-left and stays on screen', async ({ page }) => {
    await goto(page, '/')

    const samples: Sample[] = []
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      await scrollToFraction(page, f)
      samples.push(await sample(page))
    }

    const width = await page.locator('[data-flight-path]').evaluate((el) => el.getBoundingClientRect().width)
    const viewportH = page.viewportSize()!.height
    const xs = samples.map((s) => s.beeX)

    // Starts right, ends left, and actually traverses the page.
    expect(xs[0]).toBeGreaterThan(width * 0.55)
    expect(xs[xs.length - 1]).toBeLessThan(width * 0.45)
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(width * 0.4)

    // Regression guard: positioning by arc length let the bee outrun the
    // scroll. It must remain visible at every depth.
    for (const [i, s] of samples.entries()) {
      expect(s.viewportY, `bee off-screen at scroll step ${i}`).toBeGreaterThan(-80)
      expect(s.viewportY, `bee off-screen at scroll step ${i}`).toBeLessThan(viewportH + 80)
    }

    // It moves at every step rather than sticking.
    expect(new Set(samples.map((s) => s.transform)).size).toBe(samples.length)
  })

  test('the trail draws monotonically from empty to complete', async ({ page }) => {
    await goto(page, '/')
    const drawn: number[] = []
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      await scrollToFraction(page, f)
      drawn.push((await sample(page)).drawn)
    }
    expect(drawn[0]).toBeLessThan(0.02)
    expect(drawn[drawn.length - 1]).toBeGreaterThan(0.98)
    for (let i = 1; i < drawn.length; i++) {
      expect(drawn[i], `trail went backwards at step ${i}: ${drawn.join(' -> ')}`).toBeGreaterThan(drawn[i - 1])
    }
  })

  test('the trail keeps clear of centred section content', async ({ page }) => {
    await goto(page, '/')
    // At each section's midpoint the bee should be out in a side gutter, not
    // crossing the headline. Prompt 2 puts real content in that centre column.
    for (const [i, f] of [0.06, 0.5, 0.94].entries()) {
      await scrollToFraction(page, f)
      const { beeX } = await sample(page)
      const width = await page.locator('[data-flight-path]').evaluate((el) => el.getBoundingClientRect().width)
      const ratio = beeX / width
      const inGutter = ratio < 0.3 || ratio > 0.7
      expect(inGutter, `bee at ${(ratio * 100).toFixed(0)}% width over section ${i + 1}`).toBe(true)
    }
  })

  test('renders correctly at the top, middle and bottom of the scroll', async ({ page }) => {
    await goto(page, '/')
    await scrollToFraction(page, 0, 600)
    await shot(page, 'home-scroll-top')
    await scrollToFraction(page, 0.5)
    await shot(page, 'home-scroll-mid')
    await scrollToFraction(page, 1)
    await shot(page, 'home-scroll-bottom')
  })

  test('honours prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await goto(page, '/')
    await scrollToFraction(page, 0, 600)
    const { drawn } = await sample(page)
    // With reduced motion the trail is simply shown complete, not scrubbed.
    expect(drawn).toBeGreaterThan(0.98)
    await shot(page, 'home-reduced-motion')
  })
})
