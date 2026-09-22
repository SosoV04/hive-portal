import type { Page } from '@playwright/test'

/**
 * The two viewports every page is checked and screenshotted at.
 * Desktop matches playwright.config's project viewport; mobile is a Pixel-ish
 * 390x844, which is where the design system's px-6 gutters and single-column
 * stacks take over.
 */
export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const

export type ViewportName = keyof typeof VIEWPORTS

/** Switch viewport and give layout a frame to settle before measuring. */
export async function useViewport(page: Page, name: ViewportName) {
  await page.setViewportSize(VIEWPORTS[name])
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  )
}

/**
 * Horizontal overflow check. A marquee or a fixed-width scroller is the usual
 * culprit: it widens the document and every page gets a sideways scrollbar.
 */
export async function horizontalOverflow(page: Page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
}
