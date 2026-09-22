import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import {
  SETTLE_MS,
  TOKENS,
  collectFailedRequests,
  collectPageErrors,
  goto,
  horizontalOverflow,
  scrollToFraction,
  shot,
  shotSection,
  useViewport,
  withReducedMotion,
} from './lib'
import { spotlight } from '../src/data/mock/spotlight'
import { wins } from '../src/data/mock/wins'
import { events } from '../src/data/mock/events'
import { boardPosts, BOARD_COLUMNS } from '../src/data/mock/board-posts'
import type { BoardColumn } from '../src/data/mock/board-posts'
import { partners } from '../src/data/mock/partners'
import { dateLabel } from '../src/lib/dates'

/** The six sections, top to bottom, with the eyebrow each one must carry. */
const SECTIONS = [
  { id: 'hero', eyebrow: "THIS WEEK'S FOUNDER" },
  { id: 'wins', eyebrow: 'RECENT WINS' },
  { id: 'next-up', eyebrow: 'NEXT UP AT HIVE' },
  { id: 'board-preview', eyebrow: 'ON THE BOARD' },
  { id: 'partners', eyebrow: 'POWERED BY OUR NETWORK' },
  // Quick links is the one section with no eyebrow — four tiles and a nudge.
  { id: 'quick-links', eyebrow: null },
] as const

test.describe('Home — structure', () => {
  test('renders all six sections in order, with no console errors', async ({ page }) => {
    const errors = collectPageErrors(page)
    await goto(page, '/')

    const ids = await page.evaluate(() =>
      [...document.querySelectorAll('[data-section]')].map((s) => (s as HTMLElement).dataset.section),
    )
    expect(ids).toEqual(SECTIONS.map((s) => s.id))
    expect(errors).toEqual([])
  })

  test('each section carries its eyebrow', async ({ page }) => {
    await goto(page, '/')
    for (const section of SECTIONS) {
      if (!section.eyebrow) continue
      const eyebrow = page.locator(`[data-section="${section.id}"] p`, { hasText: section.eyebrow })
      await expect(eyebrow.first(), `${section.id} eyebrow`).toHaveCount(1)
    }
  })

  test('sections stack in document order down the page', async ({ page }) => {
    await goto(page, '/')
    const tops = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-section]')].map((s) => s.offsetTop),
    )
    for (let i = 1; i < tops.length; i++) {
      expect(tops[i], `section ${SECTIONS[i].id} is above ${SECTIONS[i - 1].id}`).toBeGreaterThan(
        tops[i - 1],
      )
    }
  })
})

test.describe('Home — hero', () => {
  test('founder, company and prompts all come from spotlight.ts', async ({ page }) => {
    await goto(page, '/')
    const hero = page.locator('[data-section="hero"]')

    await expect(hero.locator('h1')).toHaveText(spotlight.name)
    await expect(hero).toContainText(spotlight.teamName)
    await expect(hero).toContainText(spotlight.teamDescription)

    for (const prompt of spotlight.prompts) {
      await expect(hero, `prompt ${prompt.label}`).toContainText(prompt.label)
      await expect(hero, `answer for ${prompt.label}`).toContainText(prompt.answer)
    }
    // Exactly the four prompts — no stray block.
    await expect(hero.locator('dl > div')).toHaveCount(4)
  })

  test('the founder photo actually loads', async ({ page }) => {
    // Regression guard: `toBeVisible` passes for a broken <img>, so this asks
    // the browser whether it decoded pixels, and watches for a 4xx on the way.
    const failures = collectFailedRequests(page)
    await goto(page, '/')
    const img = page.locator('[data-section="hero"] img')
    await expect(img).toHaveAttribute('src', spotlight.photoUrl)

    const decoded = await img.evaluate((el: HTMLImageElement) => ({
      complete: el.complete,
      naturalWidth: el.naturalWidth,
      naturalHeight: el.naturalHeight,
    }))
    expect(decoded.complete).toBe(true)
    expect(decoded.naturalWidth, 'photo URL returned no image').toBeGreaterThan(0)
    expect(decoded.naturalHeight).toBeGreaterThan(0)
    expect(failures.filter((f) => f.includes('unsplash'))).toEqual([])
  })

  test('the team logo hex carries the initials and sits on the photo', async ({ page }) => {
    await goto(page, '/')
    const hexes = page.locator('[data-section="hero"] [data-hex]')
    await expect(hexes).toHaveCount(2)

    const logo = hexes.nth(1)
    await expect(logo).toHaveText(spotlight.teamInitials)

    const boxes = await page.evaluate(() => {
      const [photo, logo] = [...document.querySelectorAll('[data-section="hero"] [data-hex]')]
      const a = photo.getBoundingClientRect()
      const b = logo.getBoundingClientRect()
      return { photo: { x: a.x, y: a.y, w: a.width, h: a.height }, logo: { x: b.x, y: b.y, w: b.width, h: b.height } }
    })
    expect(Math.round(boxes.logo.w)).toBe(88)
    // Bottom-left corner: left of the photo's centre, below its vertical middle.
    expect(boxes.logo.x).toBeLessThan(boxes.photo.x + boxes.photo.w / 2)
    expect(boxes.logo.y).toBeGreaterThan(boxes.photo.y + boxes.photo.h / 2)
  })

  test('the Ken Burns animation is declared and reduced motion turns it off', async ({ page }) => {
    await goto(page, '/')
    const motionOn = await page.locator('[data-section="hero"] img').evaluate((el) => {
      const cs = getComputedStyle(el)
      return { name: cs.animationName, duration: cs.animationDuration, timing: cs.animationTimingFunction, count: cs.animationIterationCount }
    })
    expect(motionOn.name).toBe('hive-ken-burns')
    expect(motionOn.duration).toBe('20s')
    expect(motionOn.timing).toBe('ease-in-out')
    expect(motionOn.count).toBe('infinite')

    await withReducedMotion(page, async () => {
      await goto(page, '/')
      const name = await page
        .locator('[data-section="hero"] img')
        .evaluate((el) => getComputedStyle(el).animationName)
      expect(name).toBe('none')
    })
  })

  test('the CTA points at the founder’s directory profile', async ({ page }) => {
    await goto(page, '/')
    const cta = page.locator('[data-section="hero"] a', { hasText: 'Meet the founder' })
    await expect(cta).toHaveAttribute('href', `/hive-portal/directory#${spotlight.slug}`)
  })
})

test.describe('Home — wins strip', () => {
  test('renders every win from wins.ts', async ({ page }) => {
    await goto(page, '/')
    const cards = page.locator('[data-win-card]')
    await expect(cards).toHaveCount(wins.length)

    for (const [i, win] of wins.entries()) {
      const card = cards.nth(i)
      await expect(card).toContainText(win.teamName)
      await expect(card).toContainText(win.body)
      await expect(card).toContainText(win.kind)
    }
  })

  test('the milestone label is olive-gold --success', async ({ page }) => {
    await goto(page, '/')
    const label = page.locator('[data-win-card]').first().locator('span').last()
    expect(await label.evaluate((el) => getComputedStyle(el).color)).toBe(TOKENS.success)
  })

  test('cards line up with the container and the track scrolls horizontally', async ({ page }) => {
    await goto(page, '/')
    const geometry = await page.evaluate(() => {
      const track = document.querySelector('[data-wins-track]')!
      const first = document.querySelector('[data-win-card]')!
      const container = document.querySelector('[data-section="wins"] .container-hive')!
      const cs = getComputedStyle(container)
      return {
        overflowX: getComputedStyle(track).overflowX,
        snapType: getComputedStyle(track).scrollSnapType,
        scrollable: track.scrollWidth - track.clientWidth,
        cardX: Math.round(first.getBoundingClientRect().x),
        contentX: Math.round(container.getBoundingClientRect().x + parseFloat(cs.paddingLeft)),
        cardWidth: Math.round(first.getBoundingClientRect().width),
      }
    })
    expect(geometry.overflowX).toBe('auto')
    expect(geometry.snapType).toContain('mandatory')
    expect(geometry.cardWidth).toBe(320)
    expect(geometry.scrollable, 'five 320px cards should overflow 1440px').toBeGreaterThan(0)
    // Regression guard: scroll-snap-align:start ignores the scroll container's
    // padding unless scroll-padding matches it, which silently parked card 1
    // flush against the viewport edge while the computed padding looked right.
    expect(geometry.cardX, 'card 1 must line up with the container gutter').toBe(geometry.contentX)
  })

  test('the chevrons scroll the track and disable at the ends', async ({ page }) => {
    await goto(page, '/')
    const track = page.locator('[data-wins-track]')
    const left = page.getByRole('button', { name: 'Scroll wins left' })
    const right = page.getByRole('button', { name: 'Scroll wins right' })

    await expect(left).toBeVisible()
    await expect(left).toBeDisabled()
    await expect(right).toBeEnabled()

    await right.click()
    await page.waitForTimeout(SETTLE_MS)
    const afterRight = await track.evaluate((el) => el.scrollLeft)
    expect(afterRight).toBeGreaterThan(0)
    await expect(left).toBeEnabled()

    await left.click()
    await page.waitForTimeout(SETTLE_MS)
    expect(await track.evaluate((el) => el.scrollLeft)).toBeLessThan(afterRight)
  })

  test('the chevrons are hidden on mobile — touch handles it', async ({ page }) => {
    await goto(page, '/')
    await useViewport(page, 'mobile')
    // Not getByRole: a display:none button is absent from the accessibility
    // tree, so the role locator would simply time out rather than report it.
    const display = await page
      .locator('[aria-label="Scroll wins right"]')
      .evaluate((el) => getComputedStyle(el).display)
    expect(display).toBe('none')
  })
})

test.describe('Home — next up', () => {
  test('shows exactly the next three events, in chronological order', async ({ page }) => {
    await goto(page, '/')
    const cards = page.locator('[data-event-card]')
    await expect(cards).toHaveCount(3)

    const expected = [...events]
      .sort((a, b) => new Date(a.starts).getTime() - new Date(b.starts).getTime())
      .slice(0, 3)

    for (const [i, event] of expected.entries()) {
      await expect(cards.nth(i), `card ${i} title`).toContainText(event.title)
      await expect(cards.nth(i), `card ${i} date`).toContainText(dateLabel(event.starts))
      await expect(cards.nth(i), `card ${i} location`).toContainText(event.location)
      await expect(cards.nth(i), `card ${i} host`).toContainText(event.hostName)
    }

    // And the rendered dates really do ascend — a sort that silently no-ops
    // would still satisfy the loop above if events.ts happened to be ordered.
    const ids = await cards.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.eventCard),
    )
    expect(ids).toEqual(expected.map((e) => e.id))
  })

  test('the type bar colour matches the event type', async ({ page }) => {
    await goto(page, '/')
    const expectedColour = {
      internal: TOKENS.gold,
      'cross-campus': TOKENS.black,
      external: TOKENS.goldDeep,
    } as const

    const bars = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-event-card] [data-event-type]')].map((b) => ({
        type: b.dataset.eventType!,
        bg: getComputedStyle(b).backgroundColor,
        height: b.getBoundingClientRect().height,
      })),
    )
    expect(bars).toHaveLength(3)
    for (const bar of bars) {
      expect(bar.height).toBe(4)
      expect(bar.bg, `${bar.type} bar`).toBe(expectedColour[bar.type as keyof typeof expectedColour])
    }
  })

  test('the section links to the full schedule', async ({ page }) => {
    await goto(page, '/')
    const link = page.locator('[data-section="next-up"] a', { hasText: 'See full schedule' })
    await expect(link).toHaveAttribute('href', '/hive-portal/schedule')
  })
})

test.describe('Home — board preview', () => {
  test('shows exactly one post per column, and it is the newest', async ({ page }) => {
    await goto(page, '/')
    await expect(page.locator('[data-board-post]')).toHaveCount(3)

    for (const column of BOARD_COLUMNS as BoardColumn[]) {
      const inColumn = boardPosts
        .filter((p) => p.column === column)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      expect(inColumn.length, `${column} should have four posts in the mock data`).toBe(4)

      const rendered = page.locator(`[data-board-column="${column}"] [data-board-post]`)
      await expect(rendered, `${column} shows one post`).toHaveCount(1)
      await expect(rendered).toHaveAttribute('data-board-post', inColumn[0].id)
      await expect(rendered).toContainText(inColumn[0].author)
      await expect(rendered).toContainText(inColumn[0].team)
    }
  })

  test('column dots use the column colours', async ({ page }) => {
    await goto(page, '/')
    const expected = {
      'high-five': TOKENS.gold,
      milestones: TOKENS.success,
      'this-week': TOKENS.goldDeep,
    } as const
    for (const [column, colour] of Object.entries(expected)) {
      const dot = page.locator(`[data-column-dot="${column}"]`)
      await expect(dot).toHaveCount(1)
      expect(await dot.evaluate((el) => getComputedStyle(el).backgroundColor), column).toBe(colour)
    }
  })

  test('post bodies are clamped to two lines', async ({ page }) => {
    await goto(page, '/')
    const clamped = await page.evaluate(() =>
      [...document.querySelectorAll('[data-board-post]')].map((post) => {
        const body = post.querySelectorAll('p')[2]
        const cs = getComputedStyle(body)
        return {
          clamp: cs.webkitLineClamp,
          truncated: body.scrollHeight > body.clientHeight + 1,
          lines: Math.round(body.clientHeight / parseFloat(cs.lineHeight)),
        }
      }),
    )
    for (const body of clamped) {
      expect(body.clamp).toBe('2')
      expect(body.lines).toBeLessThanOrEqual(2)
    }
    // At least one of the three is long enough to actually be cut off; if none
    // were, the clamp would be untested decoration.
    expect(clamped.some((b) => b.truncated)).toBe(true)
  })

  test('hovering a column lifts it and brightens its dot', async ({ page }) => {
    await goto(page, '/')
    const column = page.locator('[data-board-column="milestones"]')
    const dot = page.locator('[data-column-dot="milestones"]')

    const before = {
      y: (await column.boundingBox())!.y,
      opacity: await dot.evaluate((el) => getComputedStyle(el).opacity),
    }
    await column.hover()
    await page.waitForTimeout(SETTLE_MS)
    const after = {
      y: (await column.boundingBox())!.y,
      opacity: await dot.evaluate((el) => getComputedStyle(el).opacity),
    }

    expect(after.y, 'column should lift on hover').toBeLessThan(before.y)
    expect(parseFloat(after.opacity)).toBeGreaterThan(parseFloat(before.opacity))
  })

  test('the section links to the board', async ({ page }) => {
    await goto(page, '/')
    const link = page.locator('[data-section="board-preview"] a', { hasText: 'Open the board' })
    await expect(link).toHaveAttribute('href', '/hive-portal/board')
  })
})

test.describe('Home — partner marquee', () => {
  test('renders all twelve partners, duplicated for a seamless loop', async ({ page }) => {
    await goto(page, '/')
    const primary = page.locator('[data-marquee-group="primary"] [data-partner]')
    const clone = page.locator('[data-marquee-group="clone"] [data-partner]')

    await expect(primary).toHaveCount(partners.length)
    await expect(clone).toHaveCount(partners.length)
    expect(await primary.allTextContents()).toEqual([...partners])
    // The duplicate is decorative; a screen reader should hear the list once.
    await expect(page.locator('[data-marquee-group="clone"]')).toHaveAttribute('aria-hidden', 'true')
  })

  test('the two halves are the same width, so -50% lands seamlessly', async ({ page }) => {
    await goto(page, '/')
    const widths = await page.evaluate(() =>
      [...document.querySelectorAll('[data-marquee-group]')].map(
        (g) => g.getBoundingClientRect().width,
      ),
    )
    expect(widths).toHaveLength(2)
    // Regression guard: with one shared flex gap instead of a trailing pad on
    // each group, the halves differ by half a gap and the loop visibly jumps.
    expect(Math.abs(widths[0] - widths[1])).toBeLessThan(1)
  })

  test('scrolls continuously, pauses on hover', async ({ page }) => {
    await goto(page, '/')
    const track = page.locator('.marquee-track')
    const style = await track.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { name: cs.animationName, duration: cs.animationDuration, timing: cs.animationTimingFunction, count: cs.animationIterationCount }
    })
    expect(style.name).toBe('marquee')
    expect(style.duration).toBe('40s')
    expect(style.timing).toBe('linear')
    expect(style.count).toBe('infinite')

    // Not track.hover(): Playwright's actionability check waits for the
    // element to stop moving, and this one is translating forever by design.
    // Aim at the track's own vertical centre — the section's box includes
    // py-16 padding and the eyebrow, which are not the track.
    await page.locator('[data-section="partners"]').scrollIntoViewIfNeeded()
    const box = (await track.boundingBox())!
    await page.mouse.move(page.viewportSize()!.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(200)
    expect(await track.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe('paused')
  })

  test('is static under prefers-reduced-motion', async ({ page }) => {
    await withReducedMotion(page, async () => {
      await goto(page, '/')
      const name = await page
        .locator('.marquee-track')
        .evaluate((el) => getComputedStyle(el).animationName)
      expect(name).toBe('none')
    })
  })

  test('does not widen the document at either viewport', async ({ page }) => {
    // The doubled track is 3000px+ wide; without overflow-hidden on its
    // wrapper every page on the site gets a horizontal scrollbar.
    await goto(page, '/')
    const desktop = await horizontalOverflow(page)
    expect(desktop.scrollWidth, 'horizontal overflow at 1440').toBe(desktop.clientWidth)

    await useViewport(page, 'mobile')
    const mobile = await horizontalOverflow(page)
    expect(mobile.scrollWidth, 'horizontal overflow at 390').toBe(mobile.clientWidth)
  })
})

test.describe('Home — quick links', () => {
  const EXPECTED = [
    { title: 'Community Guidelines', href: '/hive-portal/space#guidelines' },
    { title: 'Feedback', href: '/hive-portal/space#feedback' },
    { title: 'Supplies', href: '/hive-portal/space#supplies' },
    { title: 'Space Info', href: '/hive-portal/space#space-info' },
  ]

  test('four tiles point at their Space anchors', async ({ page }) => {
    await goto(page, '/')
    const tiles = page.locator('[data-quick-link]')
    await expect(tiles).toHaveCount(4)
    for (const [i, tile] of EXPECTED.entries()) {
      await expect(tiles.nth(i)).toHaveAttribute('data-quick-link', tile.title)
      await expect(tiles.nth(i), `${tile.title} href`).toHaveAttribute('href', tile.href)
    }
  })

  test('every anchor target actually exists on the Space page', async ({ page }) => {
    // A tile pointing at a missing id looks fine and does nothing on click.
    await goto(page, '/space')
    for (const tile of EXPECTED) {
      const id = tile.href.split('#')[1]
      await expect(page.locator(`#${id}`), `#${id} on /space`).toHaveCount(1)
    }
  })

  test('tile icons are gold-deep and the tiles lift on hover', async ({ page }) => {
    await goto(page, '/')
    const tile = page.locator('[data-quick-link="Supplies"]')
    const icon = tile.locator('svg')
    expect(await icon.evaluate((el) => getComputedStyle(el).color)).toBe(TOKENS.goldDeep)

    const before = (await tile.boundingBox())!.y
    await tile.hover()
    await page.waitForTimeout(SETTLE_MS)
    expect((await tile.boundingBox())!.y).toBeLessThan(before)
  })

  test('the feedback nudge is italic Fraunces 400 and links to /space#feedback', async ({ page }) => {
    await goto(page, '/')
    const nudge = page.locator('[data-feedback-nudge]')
    await expect(nudge).toHaveAttribute('href', '/hive-portal/space#feedback')
    await expect(nudge).toContainText(
      'Has HIVE connected you with a person, resource, or idea this month?',
    )
    const style = await nudge.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { family: cs.fontFamily, weight: cs.fontWeight, style: cs.fontStyle, size: cs.fontSize }
    })
    expect(style.family).toContain('Fraunces')
    expect(style.weight).toBe('400')
    expect(style.style).toBe('italic')
    expect(style.size).toBe('18px') // body-lg
  })
})

test.describe('Home — typography regression', () => {
  test('Fraunces for h1/h2, Inter for footer headings and body copy', async ({ page }) => {
    await goto(page, '/')

    const h1 = await page
      .locator('h1')
      .evaluate((el) => getComputedStyle(el).fontFamily)
    expect(h1).toContain('Fraunces')

    // h3s are card titles — Inter by design, they are labels not headlines.
    const h3 = await page
      .locator('[data-event-card] h3')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily)
    expect(h3).toContain('Inter')

    // The prompt-1 bug: footer column headings are <h2>, and the base h2 rule
    // is Fraunces. They must stay Inter.
    const footerHeadings = await page.evaluate(() =>
      [...document.querySelectorAll('footer h2')].map((h) => getComputedStyle(h).fontFamily),
    )
    expect(footerHeadings).toHaveLength(4)
    for (const family of footerHeadings) expect(family).toContain('Inter')

    const body = await page
      .locator('[data-win-card] p')
      .nth(2)
      .evaluate((el) => getComputedStyle(el).fontFamily)
    expect(body).toContain('Inter')
  })
})

test.describe('Home — keyboard', () => {
  test('every interactive element is tab-reachable with a visible focus ring', async ({ page }) => {
    await goto(page, '/')

    // Walk the whole page with Tab and record what receives focus.
    const seen: string[] = []
    const rings: { tag: string; outlineWidth: string; outlineStyle: string }[] = []
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        if (!el || el === document.body) return null
        const cs = getComputedStyle(el)
        return {
          key:
            el.dataset.quickLink ??
            el.dataset.winCard ??
            el.getAttribute('aria-label') ??
            (el.textContent ?? '').trim().slice(0, 40),
          tag: el.tagName,
          outlineWidth: cs.outlineWidth,
          outlineStyle: cs.outlineStyle,
        }
      })
      if (!focused) break
      seen.push(focused.key)
      rings.push({ tag: focused.tag, outlineWidth: focused.outlineWidth, outlineStyle: focused.outlineStyle })
    }

    // Everything on the page that a keyboard user needs to reach.
    const required = [
      'Meet the founder →',
      'Scroll wins right',
      'RSVP',
      'Add to calendar',
      'See full schedule →',
      'Open the board →',
      'Community Guidelines',
      'Feedback',
      'Supplies',
      'Space Info',
    ]
    for (const label of required) {
      expect(seen.some((s) => s.includes(label)), `never focused: ${label}\nsaw: ${seen.join(' | ')}`).toBe(true)
    }

    // The left chevron is disabled at rest, so it is correctly NOT in the tab
    // order; it must join once there is somewhere to scroll back to.
    expect(seen.some((s) => s.includes('Scroll wins left'))).toBe(false)
    await page.getByRole('button', { name: 'Scroll wins right' }).click()
    await page.waitForTimeout(SETTLE_MS)
    const left = page.getByRole('button', { name: 'Scroll wins left' })
    await expect(left).toBeEnabled()
    await left.focus()
    await expect(left).toBeFocused()

    // :focus-visible paints a 2px gold-deep outline — every stop must show one.
    const ringless = rings.filter((r) => r.outlineStyle === 'none' || r.outlineWidth === '0px')
    expect(ringless, 'focused elements with no visible focus ring').toEqual([])
  })
})

/**
 * The flight-path is the most mechanically delicate thing on the site, and
 * this prompt is the first time it has run against real content rather than
 * three grey placeholder blocks.
 */
interface Sample {
  beeX: number
  beeY: number
  viewportY: number
  drawn: number
  transform: string
  width: number
}

async function sampleBee(page: Page): Promise<Sample> {
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
      width: svgBox.width,
    }
  })
}

test.describe('Home — flight path', () => {
  test('the path spans the whole page and carries exactly one bee', async ({ page }) => {
    await goto(page, '/')
    await expect(page.locator('[data-flight-path]')).toHaveCount(1)
    await expect(page.locator('[data-flight-path] [data-bee]')).toHaveCount(1)

    const coverage = await page.evaluate(() => {
      const svg = document.querySelector('[data-flight-path]')!.getBoundingClientRect()
      const sections = [...document.querySelectorAll('[data-section]')]
      const last = sections[sections.length - 1].getBoundingClientRect()
      return { svgHeight: svg.height, contentHeight: last.bottom - sections[0].getBoundingClientRect().top }
    })
    // The overlay must cover every section, not just the first screenful.
    expect(coverage.svgHeight).toBeGreaterThanOrEqual(coverage.contentHeight - 2)
  })

  test('the bee stays in a side gutter at 25%, 50% and 75% scroll', async ({ page }) => {
    await goto(page, '/')
    const centreBand = { from: 0.3, to: 0.7 } // the middle 40% of the viewport

    for (const fraction of [0.25, 0.5, 0.75]) {
      await scrollToFraction(page, fraction)
      const { beeX, width } = await sampleBee(page)
      const ratio = beeX / width
      expect(
        ratio < centreBand.from || ratio > centreBand.to,
        `at ${fraction * 100}% scroll the bee sat at ${(ratio * 100).toFixed(1)}% width — inside the centre 40%`,
      ).toBe(true)
    }
  })

  test('the bee never overlaps rendered content, at any scroll depth', async ({ page }) => {
    // The stronger, and more honest, version of the gutter check. Any route
    // that starts top-right and ends bottom-left has to cross the middle
    // somewhere; what must never happen is the bee or its trail sitting on
    // top of something a member is reading. So this sweeps the whole scroll
    // and intersects the bee's box with every content box on the page.
    await goto(page, '/')
    const offenders: string[] = []
    for (let f = 0; f <= 1.0001; f += 0.05) {
      await scrollToFraction(page, f, 450)
      const hits = await page.evaluate(() => {
        const bee = document.querySelector('[data-bee]')!.getBoundingClientRect()
        const selector =
          'h1, h2, h3, p, img, button, a, [data-win-card], [data-event-card], [data-quick-link], [data-board-post]'
        return [...document.querySelectorAll(selector)]
          .filter((el) => {
            // Nav and footer sit outside the flight path's overlay entirely.
            if (el.closest('header, footer')) return false
            // The partner marquee is edge-to-edge by design — it has no gutter
            // for anyone to stand in, and the bee is only ever passing over it.
            if (el.closest('[data-marquee-group]')) return false
            const r = el.getBoundingClientRect()
            if (r.width === 0 || r.height === 0) return false
            return !(r.right < bee.left || r.left > bee.right || r.bottom < bee.top || r.top > bee.bottom)
          })
          .map((el) => `${el.tagName}: ${(el.textContent ?? '').trim().slice(0, 30)}`)
      })
      if (hits.length) offenders.push(`${(f * 100).toFixed(0)}% -> ${hits.join(', ')}`)
    }
    expect(offenders, 'scroll depths where the bee sat on top of content').toEqual([])
  })

  test('the bee travels top-right to bottom-left and stays on screen', async ({ page }) => {
    await goto(page, '/')

    const samples: Sample[] = []
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      await scrollToFraction(page, f)
      samples.push(await sampleBee(page))
    }

    const width = samples[0].width
    const viewportH = page.viewportSize()!.height
    const xs = samples.map((s) => s.beeX)

    expect(xs[0]).toBeGreaterThan(width * 0.55)
    expect(xs[xs.length - 1]).toBeLessThan(width * 0.45)
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(width * 0.4)

    // Regression guard: positioning by arc length let the bee outrun the
    // scroll. It must remain visible at every depth.
    for (const [i, s] of samples.entries()) {
      expect(s.viewportY, `bee off-screen at scroll step ${i}`).toBeGreaterThan(-80)
      expect(s.viewportY, `bee off-screen at scroll step ${i}`).toBeLessThan(viewportH + 80)
    }

    expect(new Set(samples.map((s) => s.transform)).size).toBe(samples.length)
  })

  test('the trail draws monotonically from empty to complete', async ({ page }) => {
    await goto(page, '/')
    const drawn: number[] = []
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      await scrollToFraction(page, f)
      drawn.push((await sampleBee(page)).drawn)
    }
    expect(drawn[0]).toBeLessThan(0.02)
    expect(drawn[drawn.length - 1]).toBeGreaterThan(0.98)
    for (let i = 1; i < drawn.length; i++) {
      expect(
        drawn[i],
        `trail went backwards at step ${i}: ${drawn.join(' -> ')}`,
      ).toBeGreaterThan(drawn[i - 1])
    }
  })

  test('honours prefers-reduced-motion', async ({ page }) => {
    await withReducedMotion(page, async () => {
      await goto(page, '/')
      await scrollToFraction(page, 0, 600)
      const { drawn } = await sampleBee(page)
      // With reduced motion the trail is simply shown complete, not scrubbed.
      expect(drawn).toBeGreaterThan(0.98)
      await shot(page, 'home/reduced-motion')
    })
  })

  test('does not render when there is no gutter to fly in', async ({ page }) => {
    await goto(page, '/')
    await expect(page.locator('[data-flight-path]')).toHaveCount(1)

    // At 390px the container runs edge to edge behind a 24px gutter — there is
    // no side channel a 54px bee fits in, so the path withdraws rather than
    // flying over the copy. Content is never compressed to make room for it.
    await useViewport(page, 'mobile')
    await page.waitForTimeout(SETTLE_MS)
    await expect(page.locator('[data-flight-path]')).toHaveCount(0)
    await expect(page.locator('[data-bee]')).toHaveCount(0)
  })
})

test.describe('Home — visual baseline', () => {
  test('desktop sections', async ({ page }) => {
    await goto(page, '/')
    for (const section of SECTIONS) {
      await shotSection(page, section.id, `home/desktop-${section.id}`)
    }
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(SETTLE_MS)
    await shot(page, 'home/desktop-full', { fullPage: true })
  })

  test('mobile sections', async ({ page }) => {
    await goto(page, '/')
    await useViewport(page, 'mobile')
    for (const section of SECTIONS) {
      await shotSection(page, section.id, `home/mobile-${section.id}`)
    }
    // Scroll the whole page once first, so every whileInView reveal has fired
    // before the full-page capture — otherwise sections shoot at opacity 0.
    for (const f of [0.25, 0.5, 0.75, 1]) await scrollToFraction(page, f, 350)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(SETTLE_MS)
    await shot(page, 'home/mobile-full', { fullPage: true })
  })
})

/**
 * Bee realism and the wordmark.
 *
 * The flight path already had assertions for where the bee goes; these are
 * about what it looks like on the way — that it is drawn in perspective, that
 * the weave is actually displacing it, and that it turns to face its travel.
 */

/** translateX / translateY / rotation of the scroll-driven bee group. */
async function beeTransform(page: Page) {
  return page.evaluate(() => {
    const svg = document.querySelector('[data-flight-path]')!
    const group = svg.querySelector('g') as SVGElement
    const m = new DOMMatrixReadOnly(getComputedStyle(group).transform)
    const svgBox = svg.getBoundingClientRect()

    // The gutter centre lines the waypoints were measured onto.
    const container = svg.parentElement!.querySelector('.container-hive')!
    const inset =
      container.getBoundingClientRect().left + parseFloat(getComputedStyle(container).paddingLeft)
    const left = inset / 2
    const right = svgBox.width - inset / 2
    const waypoint = Math.abs(m.e - left) < Math.abs(m.e - right) ? left : right

    return {
      x: m.e,
      y: m.f,
      angle: (Math.atan2(m.b, m.a) * 180) / Math.PI,
      offsetFromWaypoint: m.e - waypoint,
      facing: document.querySelector('[data-bee]')!.getAttribute('data-direction'),
      width: svgBox.width,
    }
  })
}

test.describe('Home — bee realism', () => {
  test('the bee is drawn in 3/4 perspective, not as a flat specimen', async ({ page }) => {
    await goto(page, '/')

    const bee = await page.locator('[data-bee]').first().evaluate((svg) => {
      const wing = (side: string) =>
        svg.querySelector(`[data-bee-wing="${side}"] ellipse`) as SVGEllipseElement
      const membrane = (el: SVGEllipseElement) => {
        const cs = getComputedStyle(el)
        return {
          rx: parseFloat(el.getAttribute('rx')!),
          ry: parseFloat(el.getAttribute('ry')!),
          fillOpacity: parseFloat(cs.fillOpacity),
          strokeWidth: parseFloat(cs.strokeWidth),
          stroke: cs.stroke,
        }
      }
      return {
        wingCount: svg.querySelectorAll('[data-bee-wing] ellipse').length,
        near: membrane(wing('near')),
        far: membrane(wing('far')),
        bodyTransform: svg.querySelector('[data-bee-body]')!.getAttribute('transform') ?? '',
        veins: svg.querySelectorAll('[data-bee-wing] path').length,
        legs: svg.querySelectorAll('[data-bee-legs] path').length,
      }
    })

    // Two wings, each a translucent membrane with a drawn edge.
    expect(bee.wingCount).toBe(2)
    for (const w of [bee.near, bee.far]) {
      expect(w.fillOpacity).toBeCloseTo(0.35, 2)
      expect(w.strokeWidth).toBeGreaterThan(0)
      expect(w.stroke).not.toBe('none')
    }

    // The near wing is larger; the far one is shorter and foreshortened. That
    // asymmetry is what carries the perspective — a mirrored pair reads flat.
    expect(bee.near.rx).toBeGreaterThan(bee.far.rx)
    expect(bee.near.ry).toBeGreaterThan(bee.far.ry)

    // The body sits on its own axis rather than square to the frame.
    expect(bee.bodyTransform).toMatch(/rotate\(-?1[0-9]/)

    expect(bee.veins).toBe(4) // two per wing
    expect(bee.legs).toBe(3)
  })

  test('the weave displaces the bee from its waypoint without clipping', async ({ page }) => {
    await goto(page, '/')

    const offsets: number[] = []
    for (const fraction of [0.25, 0.5, 0.75]) {
      await scrollToFraction(page, fraction)
      offsets.push((await beeTransform(page)).offsetFromWaypoint)
    }

    // The weave reaches 40px each way and is pinned to zero at every waypoint,
    // so a depth that happens to land on one legitimately reads near zero —
    // what must hold is that none of them is clipped past the amplitude, and
    // that the wave is doing real work somewhere across the three.
    for (const [i, offset] of offsets.entries()) {
      expect(
        Math.abs(offset),
        `weave clipped at scroll step ${i}: ${offsets.map((o) => o.toFixed(1)).join(', ')}`,
      ).toBeLessThanOrEqual(41)
    }
    expect(
      Math.max(...offsets.map(Math.abs)),
      `weave is flat: ${offsets.map((o) => o.toFixed(1)).join(', ')}`,
    ).toBeGreaterThan(10)
  })

  test('the bee turns to face the way it is travelling', async ({ page }) => {
    await goto(page, '/')

    const samples: { angle: number; facing: string | null }[] = []
    for (const fraction of [0.25, 0.5, 0.75]) {
      await scrollToFraction(page, fraction)
      const { angle, facing } = await beeTransform(page)
      samples.push({ angle: Math.round(angle), facing })
    }

    // The heading is live, not a constant.
    expect(
      new Set(samples.map((s) => s.angle)).size,
      `heading never changed: ${samples.map((s) => s.angle).join(', ')}`,
    ).toBeGreaterThan(1)

    for (const { angle, facing } of samples) {
      // Clamped, so the bee never reads as flying sideways or diving.
      expect(Math.abs(angle)).toBeLessThanOrEqual(20)
      // The artwork mirrors to match the sign of the turn.
      if (Math.abs(angle) > 1) expect(facing).toBe(angle >= 0 ? 'right' : 'left')
    }
  })

  test('reduced motion stills the wings and the hover, but still flies the scroll', async ({
    page,
  }) => {
    await withReducedMotion(page, async () => {
      await goto(page, '/')
      await scrollToFraction(page, 0.5)

      const readMotion = () =>
        page.evaluate(() => ({
          // framer-motion writes its animated values to inline style, so an
          // empty string here means nothing is being driven at all.
          beats: [...document.querySelectorAll('[data-bee-beat]')].map(
            (g) => (g as SVGElement).style.transform,
          ),
          bob: (document.querySelector('[data-bee-bob]') as SVGElement).style.transform,
        }))

      const first = await readMotion()
      // Longer than a full 0.7s wingbeat and a quarter of the 2.4s hover, so a
      // running animation could not land back on the same values by chance.
      await page.waitForTimeout(900)
      const second = await readMotion()

      expect(first.beats).toEqual(['', ''])
      expect(second.beats).toEqual(['', ''])
      expect(first.bob).toBe('')
      expect(second.bob).toBe('')

      // The bee is still placed by scroll, and still out in a gutter.
      const at50 = await beeTransform(page)
      const ratio = at50.x / at50.width
      expect(ratio < 0.3 || ratio > 0.7, `bee at ${(ratio * 100).toFixed(1)}% width`).toBe(true)

      await scrollToFraction(page, 0.85)
      const at85 = await beeTransform(page)
      expect(at85.y).toBeGreaterThan(at50.y)
    })
  })
})

test.describe('Nav — wordmark', () => {
  for (const viewport of ['desktop', 'mobile'] as const) {
    test(`is Space Grotesk, tightly tracked, at ${viewport}`, async ({ page }) => {
      await goto(page, '/')
      await useViewport(page, viewport)

      const mark = page.locator('header a', { hasText: 'HIVE' }).first()
      const style = await mark.evaluate((el) => {
        const cs = getComputedStyle(el)
        return {
          family: cs.fontFamily,
          weight: cs.fontWeight,
          size: parseFloat(cs.fontSize),
          tracking: parseFloat(cs.letterSpacing),
        }
      })

      expect(style.family).toContain('Space Grotesk')
      expect(style.weight).toBe('700')
      expect(style.size).toBeCloseTo(24, 0)

      // Negative, and by at least -0.04em: at default spacing Space Grotesk's
      // narrow I opens a gap and the mark reads "H IVE".
      expect(style.tracking).toBeLessThan(0)
      expect(style.tracking).toBeLessThanOrEqual(-0.04 * style.size + 0.01)
    })
  }
})

test.describe('Home — bee and wordmark baselines', () => {
  test('hero and wins captures carry both the bee and the wordmark', async ({ page }) => {
    await goto(page, '/')

    for (const section of ['hero', 'wins'] as const) {
      await page.evaluate((id) => {
        document
          .querySelector(`[data-section="${id}"]`)!
          .scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior })
      }, section)
      await page.waitForTimeout(SETTLE_MS)

      const visible = await page.evaluate(() => {
        const onScreen = (r?: DOMRect) =>
          !!r && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth
        const mark = [...document.querySelectorAll('header a')].find(
          (a) => a.textContent?.trim() === 'HIVE',
        )
        return {
          bee: onScreen(document.querySelector('[data-bee]')?.getBoundingClientRect()),
          mark: onScreen(mark?.getBoundingClientRect()),
        }
      })

      expect(visible.bee, `bee off-screen for the ${section} capture`).toBe(true)
      expect(visible.mark, `wordmark off-screen for the ${section} capture`).toBe(true)

      await shot(page, `home/${section}`)
    }
  })
})
