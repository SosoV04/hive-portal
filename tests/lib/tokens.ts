import { expect } from '@playwright/test'
import type { Locator } from '@playwright/test'

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

export type TokenName = keyof typeof TOKENS

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

/** Read one computed style property off a locator. */
export function computed(locator: Locator, property: string) {
  return locator.evaluate(
    (el, p) => getComputedStyle(el).getPropertyValue(p),
    property,
  )
}

/**
 * Assert a computed colour equals a palette token.
 *
 * Colour assertions are the ones most likely to go quietly wrong (a hex typed
 * by hand, a Tailwind class that got merged away), so they get a helper that
 * names the token in the failure message rather than printing two rgb triples.
 */
export async function expectToken(
  locator: Locator,
  property: 'color' | 'backgroundColor' | 'borderTopColor' | 'borderBottomColor' | 'fill',
  token: TokenName,
  because = '',
) {
  const actual = await locator.evaluate(
    (el, p) => getComputedStyle(el)[p as 'color'],
    property,
  )
  expect(actual, `${property} should be --${token}${because ? ` (${because})` : ''}`).toBe(
    TOKENS[token],
  )
}

/** Assert font family + weight in one go — the prompt-1 footer bug was exactly this pair. */
export async function expectFont(
  locator: Locator,
  family: 'Fraunces' | 'Inter',
  weight?: string,
) {
  const style = await locator.evaluate((el) => {
    const cs = getComputedStyle(el)
    return { family: cs.fontFamily, weight: cs.fontWeight }
  })
  expect(style.family, `expected ${family}, got ${style.family}`).toContain(family)
  if (weight) expect(style.weight).toBe(weight)
}
