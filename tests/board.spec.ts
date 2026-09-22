import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import {
  SETTLE_MS,
  TOKENS,
  collectPageErrors,
  goto,
  shot,
  useViewport,
  withReducedMotion,
} from './lib'
import {
  BOARD_COLUMNS,
  boardPosts,
  type BoardColumn,
  type BoardPost,
} from '../src/data/mock/board-posts'
import { DEFAULT_FILTERS, filterPosts, type BoardFilters } from '../src/components/board/filters'
import { TILE_GAP } from '../src/components/board/honeycomb'

/**
 * The Board.
 *
 * Expected post sets come from the app's own filterPosts(), so the spec and
 * the page cannot disagree about what "this week" means — the alternative is a
 * second implementation of the filter living in the test file, which is how a
 * green suite ends up asserting the wrong thing.
 */

const TOTAL = boardPosts.length

function expectedPosts(overrides: Partial<BoardFilters> = {}) {
  return filterPosts(boardPosts, { ...DEFAULT_FILTERS, ...overrides })
}

function inColumn(posts: BoardPost[], column: BoardColumn) {
  return posts.filter((post) => post.column === column)
}

function post(id: string) {
  const found = boardPosts.find((p) => p.id === id)
  if (!found) throw new Error(`no mock post ${id}`)
  return found
}

/** Rendered post ids, in DOM order. */
function renderedIds(scope: Locator) {
  return scope.evaluateAll((els) => els.map((el) => el.getAttribute('data-board-post')))
}

async function chooseTimeframe(page: Page, timeframe: string) {
  await page.click('[data-filter-trigger="timeframe"]')
  await page.click(`[data-timeframe-option="${timeframe}"]`)
}

/**
 * Click a view tab and sample the incoming view's opacity every frame, all
 * inside the page.
 *
 * Reading the opacity from the test side needs two round trips, and under a
 * loaded parallel run those can outlast the 300ms fade — the first version of
 * this check went green on its own and flaked in the full suite. Sampling
 * in-page costs no round trips, so a starved renderer still produces a frame
 * before the fade is over.
 */
async function sampleViewSwap(page: Page, tab: string) {
  return page.evaluate(async (selector) => {
    document.querySelector<HTMLElement>(selector)!.click()
    const samples: number[] = []
    for (let i = 0; i < 24; i++) {
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const view = document.querySelector('#board-body > div')
      if (view) samples.push(parseFloat(getComputedStyle(view).opacity))
    }
    return samples
  }, tab)
}

async function chooseTeams(page: Page, teams: string[]) {
  await page.click('[data-filter-trigger="teams"]')
  for (const team of teams) await page.click(`[data-team-option="${team}"]`)
  // The checklist is multi-select, so it stays open until dismissed.
  await page.keyboard.press('Escape')
}

test.describe('Board — columns view', () => {
  test('renders every column with its own posts, newest first', async ({ page }) => {
    const errors = collectPageErrors(page)
    await goto(page, '/board')

    const expected = expectedPosts()
    expect(expected.length, 'the month default should show the whole mock set').toBe(TOTAL)
    await expect(page.locator('[data-board-post]')).toHaveCount(expected.length)

    for (const column of BOARD_COLUMNS) {
      const want = inColumn(expected, column)
      const rendered = page.locator(`[data-board-column="${column}"] [data-board-post]`)
      await expect(rendered, column).toHaveCount(want.length)
      expect(await renderedIds(rendered), `${column} order`).toEqual(want.map((p) => p.id))
      await expect(page.locator(`[data-column-count="${column}"]`)).toHaveText(String(want.length))
    }

    expect(errors).toEqual([])
  })

  test('column headers carry the column dot colour and stick below the filter bar', async ({
    page,
  }) => {
    await goto(page, '/board')
    const colours = {
      'high-five': TOKENS.gold,
      milestones: TOKENS.success,
      'this-week': TOKENS.goldDeep,
    } as const

    for (const [column, colour] of Object.entries(colours)) {
      const dot = page.locator(`[data-column-header="${column}"] [data-column-dot="${column}"]`)
      expect(await dot.evaluate((el) => getComputedStyle(el).backgroundColor), column).toBe(colour)
    }

    // The double-sticky check: bar under nav, headers under the bar.
    await page.evaluate(() => window.scrollTo(0, 900))
    await page.waitForTimeout(SETTLE_MS)
    const stack = await page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect()
      return {
        nav: box('header'),
        bar: box('[data-filter-bar]'),
        head: box('[data-column-header="high-five"]'),
      }
    })
    expect(
      Math.round(stack.bar.top),
      "filter bar parks on the nav's bottom edge — 72px row plus its 1px border",
    ).toBe(
      Math.round(stack.nav.bottom),
    )
    expect(stack.head.top, 'column header clears the filter bar').toBeGreaterThanOrEqual(
      stack.bar.bottom - 1,
    )
  })

  test('post bodies keep the founder voice exactly as written', async ({ page }) => {
    await goto(page, '/board')

    for (const id of ['post-hf-1', 'post-ms-1', 'post-tw-1']) {
      const body = page.locator(`[data-board-post="${id}"] [data-post-body]`)
      const rendered = await body.textContent()
      expect(rendered, `${id} is rendered verbatim`).toBe(post(id).body)
      // No CSS doing the tidying that the JSX refused to do.
      const style = await body.evaluate((el) => {
        const cs = getComputedStyle(el)
        return { transform: cs.textTransform, firstLetter: cs.fontVariantCaps }
      })
      expect(style.transform).toBe('none')
    }

    const first = await page
      .locator('[data-board-post="post-hf-1"] [data-post-body]')
      .textContent()
    expect(first!.startsWith('shoutout'), 'no sentence-casing').toBe(true)
    expect(first!.endsWith('hero.'), 'nothing appended to the end').toBe(true)
    // The typographic apostrophe the author typed survives the round trip.
    expect(await page.locator('[data-board-post="post-tw-1"] [data-post-body]').textContent())
      .toContain('bruno’s')
  })
})

test.describe('Board — filters', () => {
  test('a column chip hides that column and updates the count', async ({ page }) => {
    await goto(page, '/board')
    const chip = page.locator('[data-column-chip="high-five"]')
    await expect(chip).toHaveAttribute('aria-checked', 'true')
    await expect(chip).toHaveRole('checkbox')

    await chip.click()
    await expect(chip).toHaveAttribute('aria-checked', 'false')
    await expect(page.locator('[data-board-column="high-five"]')).toHaveCount(0)

    const expected = expectedPosts({
      visibleColumns: { ...DEFAULT_FILTERS.visibleColumns, 'high-five': false },
    })
    await expect(page.locator('[data-board-post]')).toHaveCount(expected.length)
    await expect(page.locator('[data-filter-summary]')).toContainText(
      `Showing ${expected.length} of ${TOTAL} posts`,
    )
    await expect(page.locator('[data-filter-live]')).toContainText(
      `Showing ${expected.length} of ${TOTAL} posts`,
    )

    // Chips toggle independently.
    await page.click('[data-column-chip="this-week"]')
    await expect(page.locator('[data-board-column="milestones"]')).toHaveCount(1)
    await expect(page.locator('[data-board-column="this-week"]')).toHaveCount(0)

    await page.click('[data-clear-filters]')
    await expect(page.locator('[data-board-post]')).toHaveCount(TOTAL)
    await expect(page.locator('[data-filter-summary]')).toHaveCount(0)
  })

  test('the team checklist multi-selects across columns', async ({ page }) => {
    await goto(page, '/board')
    const teams = ['Knuckle', 'HIVE']
    await chooseTeams(page, teams)

    await expect(page.locator('[data-filter-trigger="teams"]')).toContainText('2 teams')

    const expected = expectedPosts({ selectedTeams: teams })
    expect(expected.length).toBeGreaterThan(2)
    await expect(page.locator('[data-board-post]')).toHaveCount(expected.length)

    for (const column of BOARD_COLUMNS) {
      const rendered = page.locator(`[data-board-column="${column}"] [data-board-post]`)
      expect(await renderedIds(rendered), column).toEqual(
        inColumn(expected, column).map((p) => p.id),
      )
    }

    // Deselecting one team leaves the other applied.
    await page.click('[data-filter-trigger="teams"]')
    await page.click('[data-team-option="HIVE"]')
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-filter-trigger="teams"]')).toContainText('1 team')
    await expect(page.locator('[data-board-post]')).toHaveCount(
      expectedPosts({ selectedTeams: ['Knuckle'] }).length,
    )
  })

  test('the timeframe dropdown filters by post timestamp', async ({ page }) => {
    await goto(page, '/board')
    await expect(page.locator('[data-filter-trigger="timeframe"]')).toContainText('This month')

    for (const timeframe of ['today', 'week', 'all', 'month'] as const) {
      await chooseTimeframe(page, timeframe)
      const expected = expectedPosts({ timeframe })
      await expect(page.locator('[data-board-post]'), timeframe).toHaveCount(expected.length)
      expect(await renderedIds(page.locator('[data-board-post]'))).toEqual(
        // Column sections are laid out left to right, so DOM order is by column.
        BOARD_COLUMNS.flatMap((column) => inColumn(expected, column).map((p) => p.id)),
      )
    }

    // The spread in the mock data is what makes the filter meaningful at all.
    expect(expectedPosts({ timeframe: 'today' }).length, 'two posts today').toBe(2)
    expect(expectedPosts({ timeframe: 'week' }).length, 'six inside the week').toBe(6)
    expect(expectedPosts({ timeframe: 'all' }).length).toBe(TOTAL)
  })

  test('an emptied column shows the bee and nothing else', async ({ page }) => {
    await goto(page, '/board')
    await chooseTimeframe(page, 'today')

    const empty = page.locator('[data-board-column="milestones"] [data-empty-state]')
    await expect(empty).toHaveCount(1)
    await expect(empty.locator('[data-bee]')).toHaveCount(1)
    await expect(empty).toContainText('Nothing here yet.')
    // No CTA in the column — the header's + button already offers one.
    await expect(empty.locator('button')).toHaveCount(0)
    expect(await empty.locator('[data-bee]').evaluate((el) => el.getAttribute('width'))).toBe('32')

    // Filter everything out: all three columns go quiet.
    await chooseTeams(page, ['Rehearsal'])
    await expect(page.locator('[data-board-post]')).toHaveCount(0)
    await expect(page.locator('[data-empty-state]')).toHaveCount(3)
  })
})

test.describe('Board — wall view', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/board')
    await page.click('[data-view-tab="wall"]')
    await page.waitForTimeout(SETTLE_MS)
  })

  test('tessellates: every other row is offset by half the in-row pitch', async ({ page }) => {
    const toggle = page.locator('[data-view-tab="wall"]')
    await expect(toggle).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('[data-view-tab="columns"]')).toHaveAttribute(
      'aria-selected',
      'false',
    )

    const cells = await page.evaluate(() => {
      const grid = document.querySelector('[data-wall-grid]')!.getBoundingClientRect()
      return [...document.querySelectorAll('[data-wall-tile], [data-wall-empty]')].map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.x - grid.x, y: r.y - grid.y, w: r.width, h: r.height }
      })
    })
    expect(cells.length).toBeGreaterThan(12)

    const width = cells[0].w
    const height = cells[0].h
    // Flat-top: √3/2 of the width, within a pixel of rounding.
    expect(Math.abs(height / width - 0.8660254)).toBeLessThan(0.01)

    const rows = [...new Set(cells.map((c) => Math.round(c.y)))].sort((a, b) => a - b)
    expect(rows.length, 'more than one row of comb').toBeGreaterThan(2)

    const rowOf = (y: number) => cells.filter((c) => Math.round(c.y) === y).sort((a, b) => a.x - b.x)
    const first = rowOf(rows[0])
    const second = rowOf(rows[1])
    const pitch = first[1].x - first[0].x
    const cell = width + TILE_GAP

    expect(Math.abs(pitch - 1.5 * cell), 'in-row pitch is 1.5 tile widths').toBeLessThan(1)
    expect(
      Math.abs(second[0].x - first[0].x - pitch / 2),
      'odd rows are offset by half the pitch',
    ).toBeLessThan(1)
    expect(Math.abs(rows[1] - rows[0] - (height + TILE_GAP) / 2), 'rows step half a hex').toBeLessThan(1)

    // Third row lands back on the even columns — the lattice, not a zigzag.
    const third = rowOf(rows[2])
    expect(Math.abs(third[0].x - first[0].x)).toBeLessThan(1)

    // Diagonal neighbours share an edge: centre distance = √3 · (cell / 2).
    const centre = (c: { x: number; y: number }) => ({ x: c.x + width / 2, y: c.y + height / 2 })
    const a = centre(first[0])
    const b = centre(second[0])
    const distance = Math.hypot(b.x - a.x, b.y - a.y)
    expect(Math.abs(distance - Math.sqrt(3) * (cell / 2)), 'edge-sharing neighbours').toBeLessThan(2)
  })

  test('every filtered post gets a tile, with empty comb cells scattered through', async ({
    page,
  }) => {
    await expect(page.locator('[data-wall-tile]')).toHaveCount(TOTAL)
    const empties = await page.locator('[data-wall-empty]').count()
    const ratio = empties / (empties + TOTAL)
    expect(ratio, 'roughly 15-20% of the wall is left to grow into').toBeGreaterThan(0.1)
    expect(ratio).toBeLessThan(0.3)

    // Hiding a column reflows the comb rather than leaving holes.
    await page.click('[data-column-chip="this-week"]')
    await page.waitForTimeout(SETTLE_MS)
    const expected = expectedPosts({
      visibleColumns: { ...DEFAULT_FILTERS.visibleColumns, 'this-week': false },
    })
    await expect(page.locator('[data-wall-tile]')).toHaveCount(expected.length)
    await expect(page.locator('[data-wall-tile][data-column="this-week"]')).toHaveCount(0)
  })

  test('tile colours carry the column rhythm, and the legend names them', async ({ page }) => {
    const fills = {
      'high-five': TOKENS.white,
      milestones: TOKENS.goldSoft,
      'this-week': TOKENS.ink,
    } as const
    for (const [column, colour] of Object.entries(fills)) {
      const fill = page.locator(`[data-wall-fill="${column}"]`).first()
      expect(await fill.evaluate((el) => getComputedStyle(el).backgroundColor), column).toBe(colour)
    }
    // This Week tiles are the dark ones, so their text goes cream.
    const dark = page.locator('[data-wall-tile][data-column="this-week"]').first()
    expect(await dark.locator('span').last().evaluate((el) => getComputedStyle(el).color)).toBe(
      TOKENS.cream,
    )

    const legend = page.locator('[data-wall-legend]')
    await expect(legend).toBeVisible()
    for (const column of BOARD_COLUMNS) {
      await expect(legend.locator(`[data-column-dot="${column}"]`)).toHaveCount(1)
    }
    // No sticky column headers out here.
    await expect(page.locator('[data-column-header]')).toHaveCount(0)
  })

  test('a tile opens its full post on Enter, and Escape closes it', async ({ page }) => {
    const tile = page.locator('[data-wall-tile="post-ms-1"]')
    await tile.focus()
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-wall-tile'))).toBe(
      'post-ms-1',
    )

    await page.keyboard.press('Enter')
    const detail = page.locator('[data-wall-detail="post-ms-1"]')
    await expect(detail).toBeVisible()
    // Full body, not the 4-line clamp.
    expect(await detail.locator('[data-post-body]').textContent()).toBe(post('post-ms-1').body)
    await expect(detail.locator('[data-reaction="bee"]')).toHaveCount(1)

    await page.keyboard.press('Escape')
    await expect(detail).toHaveCount(0)

    // Space works too.
    await tile.focus()
    await page.keyboard.press('Space')
    await expect(page.locator('[data-wall-detail="post-ms-1"]')).toBeVisible()
  })
})

test.describe('Board — reactions', () => {
  test('a reaction increments on click and decrements on the second click', async ({ page }) => {
    await goto(page, '/board')
    const target = post('post-hf-1')
    const bee = page.locator('[data-reaction="bee"][data-post="post-hf-1"]')
    const count = bee.locator('[data-reaction-count="bee"]')

    await expect(bee).toHaveAttribute(
      'aria-label',
      `Add bee reaction, currently ${target.reactions.bee}`,
    )
    await expect(bee).toHaveAttribute('aria-pressed', 'false')

    await bee.click()
    await expect(count).toHaveText(String(target.reactions.bee + 1))
    await expect(bee).toHaveAttribute('aria-pressed', 'true')
    await expect(bee).toHaveAttribute(
      'aria-label',
      `Remove bee reaction, currently ${target.reactions.bee + 1}`,
    )

    await bee.click()
    await expect(count).toHaveText(String(target.reactions.bee))
    await expect(bee).toHaveAttribute('aria-pressed', 'false')

    // Hearts are independent of bees.
    const heart = page.locator('[data-reaction="heart"][data-post="post-hf-1"]')
    await heart.click()
    await expect(heart.locator('[data-reaction-count="heart"]')).toHaveText(
      String(target.reactions.heart + 1),
    )
    await expect(count).toHaveText(String(target.reactions.bee))
  })

  test('the ⋯ menu offers copy link and report', async ({ page }) => {
    await goto(page, '/board')
    page.on('dialog', (dialog) => dialog.dismiss())
    await page.click('[data-post-menu-trigger="post-hf-1"]')
    const menu = page.locator('[data-post-menu="post-hf-1"]')
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('menuitem')).toHaveCount(2)
    await expect(menu).toContainText('Copy link')
    await expect(menu).toContainText('Report')
    await menu.getByRole('menuitem', { name: 'Copy link' }).click()
    await expect(menu).toHaveCount(0)
  })
})

test.describe('Board — add-post modal', () => {
  test('opens from the header, traps focus, and returns it on close', async ({ page }) => {
    await goto(page, '/board')
    await page.click('[data-add-post-trigger="header"]')

    const dialog = page.locator('[data-add-post-modal]')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog).toHaveAttribute('aria-labelledby', 'add-post-title')
    await expect(page.locator('#add-post-title')).toHaveText('Post to the board')

    // Tab cannot walk out of the dialog.
    for (let i = 0; i < 24; i++) {
      await page.keyboard.press('Tab')
      const inside = await page.evaluate(
        () => !!document.activeElement?.closest('[data-add-post-modal]'),
      )
      expect(inside, `focus escaped after ${i + 1} tabs`).toBe(true)
    }
    await page.keyboard.press('Shift+Tab')
    expect(
      await page.evaluate(() => !!document.activeElement?.closest('[data-add-post-modal]')),
    ).toBe(true)

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    expect(
      await page.evaluate(() => document.activeElement?.getAttribute('data-add-post-trigger')),
    ).toBe('header')
  })

  test('a column + button pre-selects that column, and the backdrop closes', async ({ page }) => {
    await goto(page, '/board')
    await page.click('[data-add-post-trigger="milestones"]')

    await expect(page.locator('[data-modal-column="milestones"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.locator('[data-modal-column="high-five"]')).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    // The placeholder asks the question that column asks.
    await expect(page.locator('[data-modal-body]')).toHaveAttribute(
      'placeholder',
      'what did you just ship, sign, or figure out?',
    )

    await page.locator('[data-modal-backdrop]').click({ position: { x: 10, y: 10 } })
    await expect(page.locator('[data-add-post-modal]')).toHaveCount(0)
    expect(
      await page.evaluate(() => document.activeElement?.getAttribute('data-add-post-trigger')),
    ).toBe('milestones')
  })

  test('the character counter changes at 240, warns at 280 and caps at 300', async ({ page }) => {
    await goto(page, '/board')
    await page.click('[data-add-post-trigger="header"]')
    const body = page.locator('[data-modal-body]')
    const counter = page.locator('[data-modal-count]')
    const colour = () => counter.evaluate((el) => getComputedStyle(el).color)

    await body.fill('a'.repeat(239))
    await expect(counter).toHaveText('239 / 300')
    expect(await colour(), 'neutral below 240').toBe('rgba(42, 38, 34, 0.5)')

    await body.fill('a'.repeat(240))
    expect(await colour(), 'gold-deep from 240').toBe(TOKENS.goldDeep)

    await body.fill('a'.repeat(280))
    expect(await colour(), 'terracotta from 280').toBe(TOKENS.warning)

    // Hard cap: the field refuses the 301st character.
    await body.fill('a'.repeat(295))
    await body.pressSequentially('0123456789')
    await expect(counter).toHaveText('300 / 300')
    expect(await body.inputValue()).toHaveLength(300)
  })

  test('submitting appends the post to the top of its column', async ({ page }) => {
    await goto(page, '/board')
    await page.click('[data-add-post-trigger="this-week"]')

    const submit = page.locator('[data-modal-submit]')
    await expect(submit).toBeDisabled()

    await page.selectOption('[data-modal-team]', 'Tailwater')
    await page.fill('[data-modal-author]', 'Sam Vega')
    await page.fill('[data-modal-body]', 'the freight elevator is out friday. use the ramp')
    await expect(submit).toBeEnabled()
    await submit.click()

    await expect(page.locator('[data-add-post-modal]')).toHaveCount(0)
    await expect(page.locator('[data-board-post]')).toHaveCount(TOTAL + 1)

    const column = page.locator('[data-board-column="this-week"] [data-board-post]')
    const firstCard = column.first()
    await expect(firstCard).toContainText('the freight elevator is out friday. use the ramp')
    await expect(firstCard).toContainText('Tailwater')
    await expect(firstCard).toContainText('Sam Vega')
    await expect(page.locator('[data-column-count="this-week"]')).toHaveText(
      String(inColumn(expectedPosts(), 'this-week').length + 1),
    )
    // Zero reactions to start with, and the slide-in plays once.
    await expect(firstCard.locator('[data-reaction-count="bee"]')).toHaveText('0')
    expect(await firstCard.evaluate((el) => getComputedStyle(el).animationName)).toBe(
      'hive-post-in',
    )

    // A brand new team can be added inline.
    await page.click('[data-add-post-trigger="milestones"]')
    await page.selectOption('[data-modal-team]', '__new')
    await page.fill('[data-modal-new-team]', 'Brightwater')
    await page.fill('[data-modal-new-initials]', 'bw')
    await page.fill('[data-modal-author]', 'Iris Kim')
    await page.fill('[data-modal-body]', 'signed our first pilot. still shaking')
    await page.click('[data-modal-submit]')
    const newest = page.locator('[data-board-column="milestones"] [data-board-post]').first()
    await expect(newest).toContainText('Brightwater')
    await expect(newest).toContainText('BW')

    // And it joins the team filter.
    await page.click('[data-filter-trigger="teams"]')
    await expect(page.locator('[data-team-option="Brightwater"]')).toHaveCount(1)
  })
})

test.describe('Board — motion', () => {
  test('the view toggle crossfades the incoming view', async ({ page }) => {
    await goto(page, '/board')
    const samples = await sampleViewSwap(page, '[data-view-tab="wall"]')
    expect(Math.min(...samples), 'the incoming view fades in').toBeLessThan(1)

    await page.waitForTimeout(SETTLE_MS)
    const settled = await page
      .locator('#board-body > div')
      .evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    expect(settled).toBe(1)
    await expect(page.locator('[data-wall-view]')).toBeVisible()
  })

  test('reduced motion makes the swap instant and drops the slide-in', async ({ page }) => {
    await withReducedMotion(page, async () => {
      await goto(page, '/board')

      const samples = await sampleViewSwap(page, '[data-view-tab="wall"]')
      expect(new Set(samples), 'never a frame below full opacity').toEqual(new Set([1]))
      const view = page.locator('#board-body > div')
      expect(await view.evaluate((el) => getComputedStyle(el).transform)).toBe('none')

      await page.click('[data-view-tab="columns"]')
      await page.waitForTimeout(200)
      await page.click('[data-add-post-trigger="high-five"]')
      await page.fill('[data-modal-author]', 'Sam Vega')
      await page.fill('[data-modal-body]', 'nadia fixed our build at midnight')
      await page.click('[data-modal-submit]')

      const card = page.locator('[data-board-column="high-five"] [data-board-post]').first()
      expect(await card.evaluate((el) => getComputedStyle(el).animationName)).toBe('none')

      // Hover still answers in colour, just without the lift.
      const before = (await card.boundingBox())!.y
      await card.hover()
      await page.waitForTimeout(SETTLE_MS)
      expect((await card.boundingBox())!.y, 'no translate under reduced motion').toBe(before)
    })
  })

  test('a card lifts on hover and the wall tile scales', async ({ page }) => {
    await goto(page, '/board')
    const card = page.locator('[data-board-post="post-hf-1"]')
    const before = (await card.boundingBox())!.y
    await card.hover()
    await page.waitForTimeout(SETTLE_MS)
    expect((await card.boundingBox())!.y).toBeLessThan(before)

    await page.click('[data-view-tab="wall"]')
    await page.waitForTimeout(SETTLE_MS)
    const tile = page.locator('[data-wall-tile="post-hf-1"]')
    const box = (await tile.boundingBox())!
    await tile.hover()
    await page.waitForTimeout(SETTLE_MS)
    const hovered = (await tile.boundingBox())!
    expect(hovered.width / box.width, 'tile scales 1.04').toBeGreaterThan(1.02)
  })
})

test.describe('Board — keyboard', () => {
  test('tab order runs the header controls, the filter bar, then the posts', async ({ page }) => {
    await goto(page, '/board')
    await page.locator('[data-view-tab="columns"]').focus()

    const seen: string[] = []
    for (let i = 0; i < 12; i++) {
      seen.push(
        await page.evaluate(() => {
          const el = document.activeElement
          if (!el) return 'none'
          for (const attr of [
            'data-view-tab',
            'data-add-post-trigger',
            'data-column-chip',
            'data-filter-trigger',
            'data-reaction',
            'data-post-menu-trigger',
          ]) {
            const value = el.getAttribute(attr)
            if (value !== null) return `${attr}=${value}`
          }
          return el.tagName.toLowerCase()
        }),
      )
      await page.keyboard.press('Tab')
    }

    expect(seen).toEqual([
      'data-view-tab=columns',
      'data-view-tab=wall',
      'data-add-post-trigger=header',
      'data-column-chip=high-five',
      'data-column-chip=milestones',
      'data-column-chip=this-week',
      'data-filter-trigger=teams',
      'data-filter-trigger=timeframe',
      'data-add-post-trigger=high-five',
      'data-reaction=bee',
      'data-reaction=heart',
      'data-post-menu-trigger=post-hf-1',
    ])
  })
})

test.describe('Board — screenshots', () => {
  test('desktop columns and wall', async ({ page }) => {
    await goto(page, '/board')
    await page.waitForTimeout(SETTLE_MS)
    await shot(page, 'board/desktop-columns', { fullPage: true })

    await page.click('[data-view-tab="wall"]')
    await page.waitForTimeout(SETTLE_MS)
    await shot(page, 'board/desktop-wall', { fullPage: true })

    await page.locator('[data-wall-tile="post-ms-1"]').click()
    await page.waitForTimeout(SETTLE_MS)
    await shot(page, 'board/desktop-wall-detail')
  })

  test('mobile columns and wall', async ({ page }) => {
    await useViewport(page, 'mobile')
    await goto(page, '/board')
    await page.waitForTimeout(SETTLE_MS)
    await shot(page, 'board/mobile-columns', { fullPage: true })

    await page.click('[data-view-tab="wall"]')
    await page.waitForTimeout(SETTLE_MS)
    await shot(page, 'board/mobile-wall', { fullPage: true })
  })

  test('add-post modal', async ({ page }) => {
    await goto(page, '/board')
    await page.click('[data-add-post-trigger="milestones"]')
    await page.fill('[data-modal-author]', 'Nadia Okafor')
    await page.fill(
      '[data-modal-body]',
      'shipped the splint sizing guide. six people used it on the first day',
    )
    await page.waitForTimeout(300)
    await shot(page, 'board/modal-open')
  })

  test('filtered state', async ({ page }) => {
    await goto(page, '/board')
    await chooseTimeframe(page, 'week')
    await page.click('[data-column-chip="this-week"]')
    await page.waitForTimeout(SETTLE_MS)
    await shot(page, 'board/desktop-filtered', { fullPage: true })
  })
})

test.describe('Home board preview — regression after the PostCard swap', () => {
  test('still shows the newest post per column, clamped to two lines', async ({ page }) => {
    await goto(page, '/')
    await expect(page.locator('[data-board-post]')).toHaveCount(3)

    for (const column of BOARD_COLUMNS) {
      const newest = boardPosts
        .filter((p) => p.column === column)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
      const rendered = page.locator(`[data-board-column="${column}"] [data-board-post]`)
      await expect(rendered).toHaveAttribute('data-board-post', newest.id)
      await expect(rendered).toContainText(newest.author)
      await expect(rendered).toContainText(newest.team)
    }

    // The preview card is the preview card: no reactions, no ⋯ menu.
    await expect(page.locator('[data-section="board-preview"] [data-reaction]')).toHaveCount(0)
    await expect(page.locator('[data-section="board-preview"] [data-post-menu-trigger]')).toHaveCount(
      0,
    )
    const clamp = await page
      .locator('[data-board-post] p')
      .last()
      .evaluate((el) => getComputedStyle(el).webkitLineClamp)
    expect(clamp).toBe('2')
  })

  test('matches the screenshot taken before the swap', async ({ page }) => {
    await goto(page, '/')
    const section = page.locator('[data-section="board-preview"]')
    await section.scrollIntoViewIfNeeded()
    await page.waitForTimeout(SETTLE_MS)
    // Baseline is prompt 2's committed capture. The only expected difference is
    // the relative timestamp on the newest high-five, which now reads in hours
    // rather than "yesterday" — hence a ratio, not an exact match.
    await expect(section).toHaveScreenshot(['home', 'desktop-board-preview.png'], {
      maxDiffPixelRatio: 0.03,
    })
  })
})
