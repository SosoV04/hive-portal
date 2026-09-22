# Purdue HIVE — Member Portal

An internal member portal for **Purdue HIVE** (Hub for Innovation, Ventures, and Entrepreneurship),
built for a cohort of student founders.

This is a **static proof of concept**: no backend, no auth, no real data. All content comes from
typed mock data in `src/data/mock/`. It deploys to GitHub Pages.

**Live site:** https://sosov04.github.io/hive-portal/

---

## Local development

Requires Node.js **20.19+ or 22.12+** (Vite 8).

```bash
npm install
npm run dev      # dev server at http://localhost:5173/hive-portal/
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build locally
npm run lint     # oxlint
npm run test:e2e # Playwright end-to-end suite (starts the dev server itself)
```

> The dev server is served under `/hive-portal/` because `base` in `vite.config.ts` is set for
> GitHub Pages. If the repo is ever renamed, update `base` there — `BrowserRouter` reads it via
> `import.meta.env.BASE_URL`, so routing follows automatically.

---

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and publishes
`dist/` to GitHub Pages. The workflow also copies `index.html` to `404.html` so client-side deep
links (e.g. `/hive-portal/directory`) resolve instead of 404ing.

Pages must be set to **Build and deployment → Source: GitHub Actions** in repo settings.

---

## Testing

```bash
npm run test:e2e          # run everything
npm run test:e2e:ui       # interactive runner, good for debugging a single spec
npm run test:e2e:report   # open the HTML report from the last run
npx playwright test home  # run one spec by filename fragment
```

Playwright starts the dev server itself — nothing to run first. It drives the
**Microsoft Edge already installed on the machine** via `channel`, so
`npm install` never pulls a ~150MB browser. If Edge is missing:

```bash
E2E_CHANNEL=chrome npm run test:e2e        # use installed Chrome instead
npx playwright install chromium            # or fetch the bundled browser
E2E_CHANNEL= npm run test:e2e              # ...and use that
```

### What the suite covers

| Spec | Guards |
| --- | --- |
| `design-system.spec.ts` | All ten tokens on `:root`, Fraunces/Inter assignment, type scale, container and gutters, nav and footer chrome, card and button shape |
| `navigation.spec.ts` | Every route renders, exactly one active nav item, gold underline, mobile drawer (full-screen, scroll lock, Escape, navigate-and-close) |
| `primitives.spec.ts` | `<Hex>` geometry at 4 sizes × 3 variants, hover state, `<Bee>` anatomy and wing attachment |
| `strict-rules.spec.ts` | The locked hex and bee placement rules, enforced per route |
| `home.spec.ts` | All six Home sections in order, hero content matches `spotlight.ts`, wins scroll-snap and chevrons, next-3 events chronological, newest board post per column, partner marquee (12 partners, duplicated, reduced-motion), quick-link anchors, keyboard reachability, and the bee flight-path (travels top-right to bottom-left, stays on screen, trail draws monotonically, clears centred copy) |
| `resources.spec.ts` | All ten tracks render with icons and route to detail pages |

### Two things worth knowing

**Screenshots are captured on every run,** not only on failure, into
`tests/__screenshots__/` (committed, one folder per page). That is deliberate: the bugs this
harness has caught — detached SVG wings, a heading inheriting the wrong font, a
flight path crossing a headline, a dropped font-size utility — were all visible
in a render while every assertion passed. Look at them after a green run.

**The strict hex/bee rules are machine-checked.** `<Hex>`, `<Bee>`,
`<EmptyState>` and the flight-path SVG carry `data-hex`, `data-bee`,
`data-empty-state` and `data-flight-path`. `strict-rules.spec.ts` asserts every
bee sits inside an empty state or the flight path, and that neither primitive
appears in the nav or footer — so a later prompt cannot quietly add decoration
the design system forbids.

CI type-checks the suite (`tsc -b` covers `tests/`) but does not run it, since
the Ubuntu runner has no Edge. To run e2e in CI, add a job that does
`npx playwright install --with-deps chromium` and sets `E2E_CHANNEL=`.

---

## Known behaviors

Things that look like bugs, are not, and should not be "fixed":

**GitHub Pages returns HTTP 404 for deep links, while the page renders correctly.**
Visit `/hive-portal/directory` directly and the network response is `404 Not Found`, but the app
appears and works. Pages has no server-side rewrite, so any path that is not a real file misses;
the deploy workflow copies `index.html` to `404.html`, and Pages serves that body with the 404
status. React Router then reads the URL and hydrates the right route. The status code is
cosmetic — it shows up in DevTools and in `curl -I`, and it does not affect rendering,
navigation, or the user. Fixing it properly means moving off Pages or switching to hash routing,
neither of which is worth it.

---

## Design system — LOCKED

Every page inherits these values. They live in two places that must stay in sync:
CSS custom properties on `:root` in [`src/index.css`](src/index.css), mirrored under
`theme.extend` in [`tailwind.config.js`](tailwind.config.js).

### Palette

| Token          | Hex       | Tailwind          | Use                                      |
| -------------- | --------- | ----------------- | ---------------------------------------- |
| `--gold`       | `#CFB991` | `gold`            | Primary accent, Boilermaker Old Gold     |
| `--gold-deep`  | `#8E6F3E` | `gold-deep`       | Hover states, depth, secondary accent    |
| `--gold-soft`  | `#EDE3CE` | `gold-soft`       | Backgrounds, subtle fills                |
| `--black`      | `#0F0F0F` | `black`           | Text, structure — warm black, not `#000` |
| `--ink`        | `#2A2622` | `ink`             | Secondary text                           |
| `--cream`      | `#F7F4EC` | `cream`           | Page canvas                              |
| `--white`      | `#FFFFFF` | `white`           | Cards                                    |
| `--success`    | `#7A8B4F` | `success`         | Milestones/wins — muted olive, not green |
| `--warning`    | `#C25E3A` | `warning`         | Alerts — muted terracotta, not red       |
| `--border`     | `#E5DFD1` | `border`          | Soft borders, dividers                   |

### Typography

- **Display — Fraunces** (weights 400/600/900, optical-size axis enabled): `h1`, `h2`, hero copy.
  Helpers `.opsz-display` and `.opsz-text` drive the `opsz` axis.
- **Body — Inter** (400/500/600/700): everything else. Default `body` font.

| Class              | Size                          | Line height | Tracking  |
| ------------------ | ----------------------------- | ----------- | --------- |
| `text-display-xl`  | `clamp(3.5rem, 7vw, 6rem)`    | 0.95        | `-0.02em` |
| `text-display-lg`  | `clamp(2.5rem, 5vw, 4rem)`    | 1.0         | `-0.02em` |
| `text-display-md`  | `clamp(1.75rem, 3vw, 2.5rem)` | 1.1         | —         |
| `text-body-lg`     | `1.125rem`                    | 1.6         | —         |
| `text-body`        | `1rem`                        | 1.6         | —         |
| `text-body-sm`     | `0.875rem`                    | 1.5         | —         |
| `text-caption`     | `0.75rem`                     | 1.4         | `0.08em`  |

Display sizes use Fraunces 600 or 900. Section eyebrows use caption style, Inter 600, `gold-deep`
— see `<SectionEyebrow>`.

### Hexagons — STRICT

Hexagons appear in **exactly two** places sitewide:

1. Avatar / logo / category-badge frames
2. The Board's "Wall" view (honeycomb tiling of post tiles)

Nowhere else. No background patterns, no floating decoration, no hex section dividers.
Use `<Hex>` (`size`, `src`, `children`, `variant`, `color`). It renders a regular flat-top
hexagon — height is `0.866 × size` so the geometry stays correct and honeycomb tiling works.

### Bees — STRICT

Bees appear in **exactly three** moments:

1. The favicon (`public/favicon.svg`)
2. Empty states — see `<EmptyState>`, "the hive is quiet"
3. The Home page scroll flight-path (hero → wins → events → board preview), via Framer Motion
   `useScroll` + `motion.path` `pathLength`

Nowhere else. No bees on cards, in the nav, or in the footer.
Use `<Bee>` (`size`, `variant: 'static' | 'flying'`).

### Motion

- Section reveals: 12px Y-translate + fade, 400ms ease-out, Framer Motion `whileInView`
- Card hover: scale 1.02, shadow deepens, 200ms
- Board post hover: hex accent corner fills gold
- **No bouncy easing anywhere.** Only `ease-out` or `cubic-bezier(0.22, 1, 0.36, 1)`
  (`--ease-hive`, or Tailwind's `ease-hive`)
- Partner marquee: continuous scroll, 40s, pauses on hover (`animate-marquee` + `.marquee-track`)

### Spacing & layout

- Container: `1240px` max, centered, 24px gutters mobile / 48px desktop — `.container-hive`
- Section rhythm: `py-16` mobile, `py-24` desktop — `.section-rhythm`
- Cards: `rounded-2xl border border-border bg-white shadow-sm`, hover `shadow-md` — `<Card>`
- Buttons: primary = filled gold, black text; secondary = outline black, black text.
  Both `rounded-full`, Inter 600 — `<Button>`

---

## Content still to fill in

Two things in this scaffold are deliberately blank and need real values:

1. **Instagram handle** — still a `#` placeholder in
   [`src/components/Footer.tsx`](src/components/Footer.tsx), marked with a TODO. Left blank
   rather than guessed, so a wrong link never ships.
2. **The Anvil URL** points at `various-windows-489781-de8bd8574.framer.app`, which looks like
   an unclaimed Framer subdomain rather than a final address. Also marked with a TODO.
3. Everything in `src/data/mock/` except `tracks.ts` (locked and complete) and the five files
   populated for the Home page — `spotlight.ts`, `wins.ts`, `events.ts`, `board-posts.ts`,
   `partners.ts` — which hold invented-but-plausible placeholder content awaiting real copy.

---

## Structure

```
src/
  main.tsx
  App.tsx                  Router setup
  index.css                Tailwind directives + CSS custom properties
  components/
    Layout.tsx             Nav + main + Footer wrapper
    Nav.tsx                HIVE wordmark + Home · Board · Schedule · Resources · Directory
    Footer.tsx             4 columns: Space · Programs · Follow · Contact
    Hex.tsx                Hexagon primitive (strict rules above)
    Bee.tsx                Bee primitive (strict rules above)
    Button.tsx             Primary + secondary
    Card.tsx               Standard content card
    SectionEyebrow.tsx     Uppercase gold section label
    EmptyState.tsx         Uses <Bee> — "the hive is quiet"
    Reveal.tsx             The one sanctioned section reveal (12px + fade, once)
    shared/                Reused across pages — pull from here, do not re-build
      EventCard.tsx        Home "Next up" + Schedule
      EventTypeBar.tsx     4px type strip: internal · cross-campus · external
      BoardPostCard.tsx    Home board preview + Board
      ColumnDot.tsx        Board column colour key
    home/                  Home-only sections, composed by pages/Home.tsx
      Hero.tsx  WinsStrip.tsx  NextUp.tsx  BoardPreview.tsx  Marquee.tsx  QuickLinks.tsx
  pages/
    Home.tsx               prompt 2 — composes components/home/* + the bee flight path
    Board.tsx              prompt 3
    Schedule.tsx           prompt 4
    Resources.tsx          prompt 5 — track landing
    ResourceTrack.tsx      prompt 5 — individual track
    Directory.tsx          prompt 6
    Space.tsx              prompt 7 — guidelines + supplies + feedback
  data/mock/               typed mock data; tracks + the five Home files are populated
  lib/cn.ts                className merge helper (teaches tailwind-merge our type scale)
  lib/dates.ts             mock timestamps as offsets from now, + display formatters
tests/
  <page-name>.spec.ts      one spec per page — home.spec.ts, resources.spec.ts, …
  lib/                     shared helpers: tokens, viewport, motion-safe waits, DOM
  __screenshots__/         committed visual baselines, one folder per page
  probe/                   dev-only component probe page, never built into dist
```

### Routes

| Path                    | Page            |
| ----------------------- | --------------- |
| `/`                     | Home            |
| `/board`                | Board           |
| `/schedule`             | Schedule        |
| `/resources`            | Resources       |
| `/resources/:slug`      | ResourceTrack   |
| `/directory`            | Directory       |
| `/space`                | Space           |

`/space` anchors: `#space-info`, `#guidelines`, `#supplies`, `#feedback`.

### Mock data and time

Every mock timestamp in `src/data/mock/` is an offset from the moment the module loads
(`src/lib/dates.ts`), not a literal date. Wins stay inside their "last three weeks" window and
the Schedule stays in the future whenever someone opens the portal, instead of decaying into a
dead demo next semester. `events.ts` is sorted chronologically at module load, so index order is
always calendar order.
