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
| `home-flight-path.spec.ts` | Bee travels top-right to bottom-left, stays on screen, trail draws monotonically, path clears centred copy, reduced-motion |
| `resources.spec.ts` | All ten tracks render with icons and route to detail pages |

### Two things worth knowing

**Screenshots are captured on every run,** not only on failure, into
`tests/e2e/screenshots/` (gitignored). That is deliberate: the bugs this
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

1. **Footer external links** — the Programs column (BuildPurdue, Anvil, Purdue Innovates)
   and the Follow column (LinkedIn, Instagram) are `#` placeholders in
   [`src/components/Footer.tsx`](src/components/Footer.tsx). They were left blank rather than
   guessed, so a wrong link never ships.
2. Everything in `src/data/mock/` except `tracks.ts`, which is locked and complete.

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
  pages/
    Home.tsx               prompt 2
    Board.tsx              prompt 3
    Schedule.tsx           prompt 4
    Resources.tsx          prompt 5 — track landing
    ResourceTrack.tsx      prompt 5 — individual track
    Directory.tsx          prompt 6
    Space.tsx              prompt 7 — guidelines + supplies + feedback
  data/mock/               typed mock data; tracks.ts is populated, rest fill in later prompts
  lib/cn.ts                className merge helper (teaches tailwind-merge our type scale)
tests/
  e2e/                     Playwright specs + helpers
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

`/space` anchors: `#guidelines`, `#supplies`, `#feedback`.
