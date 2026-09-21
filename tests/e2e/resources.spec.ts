import { expect, test } from '@playwright/test'
import { TOKENS, goto, shot } from './helpers'
import { tracks } from '../../src/data/mock/tracks'

/**
 * tracks.ts is locked content, so the suite asserts against the data module
 * itself — if a slug, name or tagline is edited, these tests follow it, but if
 * the page stops rendering one, they fail.
 */
test.describe('resource tracks', () => {
  test('exactly ten tracks are defined, with unique slugs', async () => {
    expect(tracks).toHaveLength(10)
    expect(new Set(tracks.map((t) => t.slug)).size).toBe(10)
    for (const t of tracks) {
      expect(t.slug).toMatch(/^[a-z0-9-]+$/)
      expect(t.tagline.length).toBeGreaterThan(0)
      // Two sentences of description, per the brief.
      expect(t.description.split('. ').length).toBeGreaterThanOrEqual(2)
    }
  })

  test('the landing page renders every track with its icon', async ({ page }) => {
    await goto(page, '/resources')
    await expect(page.locator('main ul > li')).toHaveCount(10)
    await expect(page.locator('main ul > li svg.lucide')).toHaveCount(10)

    for (const track of tracks) {
      const card = page.locator('main ul > li', { hasText: track.name })
      await expect(card).toHaveCount(1)
      await expect(card).toContainText(track.tagline)
    }
    await shot(page, 'resources-landing')
  })

  test('taglines use gold-deep', async ({ page }) => {
    await goto(page, '/resources')
    const tagline = page.locator('main ul > li p').first()
    expect(await tagline.evaluate((el) => getComputedStyle(el).color)).toBe(TOKENS.goldDeep)
  })

  test('every track card routes to a detail page', async ({ page }) => {
    for (const track of tracks) {
      await goto(page, '/resources')
      await page.locator('main ul > li a', { hasText: track.name }).click()
      await expect(page).toHaveURL(new RegExp(`/resources/${track.slug}$`))
      await expect(page.locator('h1')).toContainText(track.name)
      await expect(page.locator('main')).toContainText(track.tagline)
    }
  })

  test('a detail page renders its icon and description', async ({ page }) => {
    const track = tracks[0]
    await goto(page, `/resources/${track.slug}`)
    await expect(page.locator('main svg.lucide')).toHaveCount(1)
    await expect(page.locator('main')).toContainText(track.description)
    await shot(page, 'resources-detail')
  })

  test('hovering a card lifts it', async ({ page }) => {
    await goto(page, '/resources')
    const card = page.locator('main ul > li > a > div').first()
    const before = await card.evaluate((el) => getComputedStyle(el).transform)
    await card.hover()
    await page.waitForTimeout(350)
    const after = await card.evaluate((el) => getComputedStyle(el).transform)
    expect(after).not.toBe(before)
  })
})
