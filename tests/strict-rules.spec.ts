import { expect, test } from '@playwright/test'
import { ROUTES, goto } from './lib'

/**
 * The hex and bee placement rules are stated as constraints, not suggestions.
 * These tests make them machine-checkable so a later prompt cannot sprinkle a
 * decorative hexagon or a cute bee somewhere the design system forbids.
 *
 *   Hexagons: avatar / logo / category-badge frames, and the Board's Wall.
 *   Bees:     the favicon, empty states, and the Home scroll flight-path.
 */

const ALL_PATHS = [...ROUTES.map((r) => r.path), '/resources/founder-strategy']

test.describe('strict placement rules', () => {
  for (const path of ALL_PATHS) {
    test(`${path}: every bee is in a sanctioned place`, async ({ page }) => {
      await goto(page, path)
      const stray = await page.evaluate(() => {
        const bees = [...document.querySelectorAll('[data-bee]')]
        return bees
          .filter((b) => !b.closest('[data-empty-state]') && !b.closest('[data-flight-path]'))
          .map((b) => b.parentElement?.tagName ?? 'unknown')
      })
      expect(stray, 'bees outside an empty state or the flight path').toEqual([])
    })

    test(`${path}: no bee in the nav or footer`, async ({ page }) => {
      await goto(page, path)
      expect(await page.locator('header [data-bee]').count()).toBe(0)
      expect(await page.locator('footer [data-bee]').count()).toBe(0)
    })

    test(`${path}: no hexagon in the nav or footer`, async ({ page }) => {
      await goto(page, path)
      expect(await page.locator('header [data-hex]').count()).toBe(0)
      expect(await page.locator('footer [data-hex]').count()).toBe(0)
    })
  }

  test('home has exactly one bee, and it is the flight path', async ({ page }) => {
    await goto(page, '/')
    await expect(page.locator('[data-bee]')).toHaveCount(1)
    await expect(page.locator('[data-flight-path] [data-bee]')).toHaveCount(1)
  })

  /*
    The Board's empty state moved with prompt 3: the page now opens full of
    posts, and the bee appears per column once a filter empties one. The house
    phrase went with it — an emptied column says "Nothing here yet." and
    nothing else, because its header already carries the add button.
  */
  test('the board grows its empty state when a filter empties a column', async ({ page }) => {
    await goto(page, '/board')
    await expect(page.locator('[data-empty-state]')).toHaveCount(0)

    await page.click('[data-filter-trigger="timeframe"]')
    await page.click('[data-timeframe-option="today"]')

    const empty = page.locator('[data-board-column="milestones"] [data-empty-state]')
    await expect(empty).toHaveCount(1)
    await expect(empty.locator('[data-bee]')).toHaveCount(1)
    await expect(empty).toContainText('Nothing here yet.')
  })

  test('an unknown track shows the bee empty state', async ({ page }) => {
    await goto(page, '/resources/no-such-track')
    const empty = page.locator('[data-empty-state]')
    await expect(empty).toHaveCount(1)
    await expect(empty.locator('[data-bee]')).toHaveCount(1)
    await expect(empty).toContainText('hive is quiet')
  })

  test('pages without an empty state carry no bee at all', async ({ page }) => {
    for (const path of ['/schedule', '/directory', '/space', '/resources']) {
      await goto(page, path)
      expect(await page.locator('[data-bee]').count(), `bee found on ${path}`).toBe(0)
    }
  })
})
