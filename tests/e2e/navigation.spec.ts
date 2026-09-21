import { expect, test } from '@playwright/test'
import { NAV_LABELS, ROUTES, TOKENS, collectPageErrors, goto, shot } from './helpers'

test.describe('routing and active nav state', () => {
  for (const route of ROUTES) {
    test(`${route.path} renders its own page`, async ({ page }) => {
      const errors = collectPageErrors(page)
      await goto(page, route.path)
      await expect(page.locator('main')).toContainText(route.heading)
      expect(errors, `console errors on ${route.path}`).toEqual([])
    })
  }

  test('clicking through the nav routes correctly and marks one active item', async ({ page }) => {
    await goto(page, '/')
    for (const label of NAV_LABELS) {
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: label, exact: true }).click()
      await page.waitForTimeout(400)

      const active = page.locator('header nav a[aria-current="page"]')
      await expect(active).toHaveCount(1)
      await expect(active).toHaveText(label)

      // The gold underline rides the active item.
      const underline = active.locator('span')
      await expect(underline).toHaveCount(1)
      expect(await underline.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(TOKENS.gold)
    }
    await shot(page, 'nav-active-directory')
  })

  test('a track detail page keeps Resources active', async ({ page }) => {
    await goto(page, '/resources/founder-strategy')
    const active = page.locator('header nav a[aria-current="page"]')
    await expect(active).toHaveCount(1)
    await expect(active).toHaveText('Resources')
  })

  test('an unknown route redirects home', async ({ page }) => {
    await goto(page, '/definitely-not-a-page')
    await expect(page).toHaveURL(/\/hive-portal\/$/)
    await expect(page.locator('main')).toContainText('Section 1')
  })

  test('footer utility links reach the Space page sections', async ({ page }) => {
    await goto(page, '/board')
    for (const label of ['Guidelines', 'Feedback', 'Supplies', 'Space info']) {
      await page.locator('footer a', { hasText: label }).first().click()
      await page.waitForTimeout(300)
      await expect(page).toHaveURL(/\/space/)
      await expect(page.locator('main')).toContainText('Space')
      await goto(page, '/board')
    }
  })

  test('footer contact is a mailto link', async ({ page }) => {
    await goto(page, '/space')
    await expect(page.locator('footer a[href="mailto:HIVE@purdue.edu"]')).toHaveCount(1)
  })
})

test.describe('mobile drawer', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('opens full-screen, locks scroll, navigates and closes', async ({ page }) => {
    await goto(page, '/board')

    // Desktop nav is hidden at this width.
    expect(
      await page.evaluate(() => getComputedStyle(document.querySelector('header nav')!).display),
    ).toBe('none')

    await page.getByRole('button', { name: 'Open menu' }).click()
    const drawer = page.getByRole('dialog', { name: 'Menu' })
    await expect(drawer).toBeVisible()

    const box = await drawer.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { w: Math.round(r.width), h: Math.round(r.height), vw: window.innerWidth, vh: window.innerHeight }
    })
    expect(box.w).toBe(box.vw)
    expect(box.h).toBe(box.vh)

    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
    await shot(page, 'mobile-drawer')

    await drawer.getByRole('link', { name: 'Schedule' }).click()
    await expect(page).toHaveURL(/\/schedule/)
    await expect(drawer).toHaveCount(0)
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
  })

  test('Escape closes the drawer', async ({ page }) => {
    await goto(page, '/board')
    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0)
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
  })
})
