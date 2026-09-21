import { expect, test } from '@playwright/test'
import { TOKEN_HEX, TOKENS, goto, shot } from './helpers'

/**
 * The design system is LOCKED. These tests exist so a later prompt cannot
 * quietly drift a colour, a font or the container rhythm without the suite
 * going red.
 */
test.describe('design system', () => {
  test('all ten palette tokens are defined on :root', async ({ page }) => {
    await goto(page, '/board')
    const actual = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement)
      const names = [
        '--gold', '--gold-deep', '--gold-soft', '--black', '--ink',
        '--cream', '--white', '--success', '--warning', '--border',
      ]
      return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(n).trim().toLowerCase()]))
    })
    expect(actual).toEqual(TOKEN_HEX)
  })

  test('page canvas is cream and body text is warm black', async ({ page }) => {
    await goto(page, '/board')
    const body = await page.evaluate(() => {
      const cs = getComputedStyle(document.body)
      return { bg: cs.backgroundColor, color: cs.color, family: cs.fontFamily }
    })
    expect(body.bg).toBe(TOKENS.cream)
    expect(body.color).toBe(TOKENS.black)
    // Body copy is Inter, never the display face.
    expect(body.family).toContain('Inter')
  })

  test('h1 uses Fraunces and body copy uses Inter', async ({ page }) => {
    await goto(page, '/resources')
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('h1')!).fontFamily))
      .toContain('Fraunces')
    const para = page.locator('main p').first()
    expect(await para.evaluate((el) => getComputedStyle(el).fontFamily)).toContain('Inter')
  })

  test('section eyebrow is caption-scale Inter 600 in gold-deep', async ({ page }) => {
    await goto(page, '/board')
    const eyebrow = page.locator('main p').first()
    const style = await eyebrow.evaluate((el) => {
      const cs = getComputedStyle(el)
      return {
        family: cs.fontFamily,
        weight: cs.fontWeight,
        size: cs.fontSize,
        transform: cs.textTransform,
        spacing: cs.letterSpacing,
        color: cs.color,
      }
    })
    expect(style.family).toContain('Inter')
    expect(style.weight).toBe('600')
    expect(style.size).toBe('12px') // 0.75rem
    expect(style.transform).toBe('uppercase')
    expect(style.color).toBe(TOKENS.goldDeep)
  })

  test('container is capped at 1240px and gutters respond', async ({ page }) => {
    await goto(page, '/board')
    const desktop = await page.evaluate(() => {
      const el = document.querySelector('main .container-hive')!
      const cs = getComputedStyle(el)
      return { width: el.getBoundingClientRect().width, padding: cs.paddingLeft }
    })
    expect(desktop.width).toBeLessThanOrEqual(1240)
    expect(desktop.padding).toBe('48px') // md:px-12

    await page.setViewportSize({ width: 390, height: 844 })
    const mobile = await page.evaluate(
      () => getComputedStyle(document.querySelector('main .container-hive')!).paddingLeft,
    )
    expect(mobile).toBe('24px') // px-6
  })

  test('nav chrome: sticky, white, 72px, 1px border', async ({ page }) => {
    await goto(page, '/board')
    const header = await page.evaluate(() => {
      const el = document.querySelector('header')!
      const cs = getComputedStyle(el)
      return {
        position: cs.position,
        bg: cs.backgroundColor,
        borderWidth: cs.borderBottomWidth,
        borderColor: cs.borderBottomColor,
        height: Math.round(el.querySelector('div')!.getBoundingClientRect().height),
      }
    })
    expect(header.position).toBe('sticky')
    expect(header.bg).toBe(TOKENS.white)
    expect(header.borderWidth).toBe('1px')
    expect(header.borderColor).toBe(TOKENS.border)
    expect(header.height).toBe(72)
  })

  test('wordmark is Fraunces 900', async ({ page }) => {
    await goto(page, '/board')
    const mark = page.locator('header a', { hasText: 'HIVE' }).first()
    const style = await mark.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { family: cs.fontFamily, weight: cs.fontWeight }
    })
    expect(style.family).toContain('Fraunces')
    expect(style.weight).toBe('900')
  })

  test('footer is warm black with cream text and gold Inter headings', async ({ page }) => {
    await goto(page, '/space')
    const footer = await page.evaluate(() => {
      const el = document.querySelector('footer')!
      const cs = getComputedStyle(el)
      const h = document.querySelector('footer h2')!
      const hcs = getComputedStyle(h)
      return {
        bg: cs.backgroundColor,
        color: cs.color,
        headingFamily: hcs.fontFamily,
        headingWeight: hcs.fontWeight,
        headingColor: hcs.color,
        columns: document.querySelectorAll('footer h2').length,
      }
    })
    expect(footer.bg).toBe(TOKENS.black)
    expect(footer.color).toBe(TOKENS.cream)
    // Column headings are Inter, not the display face — they are labels, not headlines.
    expect(footer.headingFamily).toContain('Inter')
    expect(footer.headingWeight).toBe('600')
    expect(footer.headingColor).toBe(TOKENS.gold)
    expect(footer.columns).toBe(4)
    await shot(page, 'design-footer')
  })

  test('cards are rounded-2xl, bordered, white', async ({ page }) => {
    await goto(page, '/resources')
    const card = await page.locator('main ul > li > a > div').first().evaluate((el) => {
      const cs = getComputedStyle(el)
      return { radius: cs.borderTopLeftRadius, border: cs.borderTopWidth, bg: cs.backgroundColor }
    })
    expect(card.radius).toBe('16px') // rounded-2xl
    expect(card.border).toBe('1px')
    expect(card.bg).toBe(TOKENS.white)
  })

  test('buttons are pill-shaped Inter 600 in both variants', async ({ page }) => {
    await goto(page, '/resources/no-such-track') // unknown slug -> empty state with a secondary button
    const secondary = page.locator('main a', { hasText: 'Back to tracks' }).first()
    const style = await secondary.evaluate((el) => {
      const cs = getComputedStyle(el)
      return {
        radius: cs.borderRadius,
        family: cs.fontFamily,
        weight: cs.fontWeight,
        color: cs.color,
        borderColor: cs.borderTopColor,
      }
    })
    expect(style.radius).toBe('9999px')
    expect(style.family).toContain('Inter')
    expect(style.weight).toBe('600')
    // Secondary: outline black, black text.
    expect(style.color).toBe(TOKENS.black)
    expect(style.borderColor).toBe(TOKENS.black)
  })

  test('cn() keeps custom font sizes alongside text colours', async ({ page }) => {
    // Regression guard: tailwind-merge classified text-caption / text-body as
    // text COLOURS, so pairing them with a real colour in one cn() call
    // silently dropped the font size. Both must survive.
    await goto(page, '/board')
    const eyebrow = page.locator('main p').first()
    const style = await eyebrow.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { size: cs.fontSize, color: cs.color }
    })
    expect(style.size).toBe('12px')
    expect(style.color).toBe(TOKENS.goldDeep)

    await goto(page, '/resources/no-such-track')
    const button = page.locator('main a', { hasText: 'Back to tracks' }).first()
    const btn = await button.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { size: cs.fontSize, color: cs.color }
    })
    expect(btn.size).toBe('14px') // text-body-sm survived VARIANTS' text-black
    expect(btn.color).toBe(TOKENS.black)
  })
})
