import { expect, test } from '@playwright/test'
import { PROBE_URL, TOKENS, shot } from './helpers'

const SIZES = [28, 44, 96, 140] as const
const VARIANTS = ['filled', 'outline', 'photo'] as const

/** A regular flat-top hexagon is √3/2 as tall as it is wide. */
const HEX_RATIO = 0.8660254

test.describe('Hex primitive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PROBE_URL, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
  })

  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      test(`${variant} @ ${size}px keeps regular hexagon geometry`, async ({ page }) => {
        const el = page.locator(`.probe-hex-${variant}-${size}`)
        await expect(el).toHaveCount(1)

        const info = await el.evaluate((node) => {
          const r = node.getBoundingClientRect()
          return {
            w: Math.round(r.width),
            h: Math.round(r.height),
            outerClip: getComputedStyle(node.children[0]).clipPath,
            innerClip: getComputedStyle(node.children[1]).clipPath,
            hasImg: !!node.querySelector('img'),
          }
        })

        expect(info.w).toBe(size)
        expect(info.h).toBe(Math.round(size * HEX_RATIO))
        // Both layers are clipped — the outer one is the 1px border.
        expect(info.outerClip).toContain('polygon')
        expect(info.innerClip).toContain('polygon')
        expect(info.hasImg).toBe(variant === 'photo')
      })
    }
  }

  test('filled fills with gold; outline rings with gold', async ({ page }) => {
    const filled = await page
      .locator('.probe-hex-filled-96')
      .evaluate((n) => getComputedStyle(n.children[1]).backgroundColor)
    expect(filled).toBe(TOKENS.gold)

    const ring = await page
      .locator('.probe-hex-outline-96')
      .evaluate((n) => getComputedStyle(n.children[0]).backgroundColor)
    expect(ring).toBe(TOKENS.gold)
  })

  test('hover deepens the fill toward gold-deep', async ({ page }) => {
    const hex = page.locator('.probe-hex-filled-140')
    await hex.hover()
    await page.waitForTimeout(350) // 200ms transition + slack
    const bg = await hex.evaluate((n) => getComputedStyle(n.children[1]).backgroundColor)
    expect(bg).toBe(TOKENS.goldDeep)
  })

  test('renders correctly at every size and variant', async ({ page }) => {
    await shot(page, 'primitive-hex-matrix')
  })
})

test.describe('Bee primitive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PROBE_URL, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
  })

  for (const size of [24, 40, 56, 96]) {
    test(`static @ ${size}px renders a square, complete bee`, async ({ page }) => {
      const bee = page.locator(`.probe-bee-static-${size}`)
      await expect(bee).toHaveCount(1)
      const info = await bee.evaluate((n) => ({
        w: Math.round(n.getBoundingClientRect().width),
        h: Math.round(n.getBoundingClientRect().height),
        wings: n.querySelectorAll('ellipse').length,
        stripes: n.querySelectorAll('rect').length,
        head: n.querySelectorAll('circle').length,
      }))
      expect(info.w).toBe(size)
      expect(info.h).toBe(size)
      // Two wings plus the body ellipse drawn twice (fill, then stroke).
      expect(info.wings).toBeGreaterThanOrEqual(4)
      expect(info.stripes).toBe(3)
      expect(info.head).toBe(1)
    })
  }

  test('wings overlap the body rather than floating beside it', async ({ page }) => {
    // Regression guard: framer-motion once overwrote the wings' transform
    // attribute, leaving them detached and asymmetric.
    const geom = await page.locator('.probe-bee-static-96').evaluate((svg) => {
      const ellipses = [...svg.querySelectorAll('ellipse')]
      const body = ellipses.find((e) => e.getAttribute('rx') === '6.2')!
      const wings = ellipses.filter((e) => e.getAttribute('rx') === '5.8')
      const box = (e: Element) => (e as SVGGraphicsElement).getBBox()
      const b = box(body)
      return {
        wingCount: wings.length,
        overlaps: wings.map((w) => {
          const r = box(w)
          return r.x < b.x + b.width && r.x + r.width > b.x
        }),
        // Mirrored about the body's vertical centre line.
        centres: wings.map((w) => +(box(w).x + box(w).width / 2).toFixed(2)),
        bodyCentre: +(b.x + b.width / 2).toFixed(2),
      }
    })
    expect(geom.wingCount).toBe(2)
    expect(geom.overlaps).toEqual([true, true])
    const [left, right] = geom.centres
    expect(Math.abs(geom.bodyCentre - left)).toBeCloseTo(Math.abs(right - geom.bodyCentre), 1)
  })

  test('renders correctly at every size and variant', async ({ page }) => {
    await shot(page, 'primitive-bee-matrix')
  })
})
