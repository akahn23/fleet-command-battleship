# Ravenfjord

**Battleship reimagined as a Viking naval strategy game.**

Command a fleet of Norse longships against a computer-controlled jarl on the cold seas of the
north. The rules are classic Battleship. The look and feel are mist, fjords, weathered timber,
and bronze.

> Status: **Milestone 2 implementation delivered in PR #5**. See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md).

## How to play

1. **Muster your fleet.** Choose a vessel, then click your waters to moor it. Press <kbd>R</kbd>
   or **Rotate Ship** to turn it, click a moored ship to lift it back, or use **Auto-Place Fleet**.
   Ships must stay on the board and may not overlap. They may touch.
2. **Start Battle** once all five are placed: Great Longship (5), Dragonship (4), War Longship (3),
   Raider (3), Scout Ship (2).
3. **Strike.** Click a square in enemy waters. You fire first, and turns alternate one shot each.
   A hit does not earn another shot. Squares already fired on can't be chosen again.
4. A sunk enemy ship is revealed. The first side to sink the whole enemy fleet wins.
   **New Battle** starts over at any time.

The game is fully keyboard playable: Tab to a board, use the arrow keys to move, and press Enter
to place or fire.

## Computer opponent and battle feedback

The computer uses a hunt-and-target strategy: it searches for ships, then prioritizes neighboring
squares after a hit and continues along a known ship line. It sees only its own shot results and
the remaining ship lengths, never hidden ship positions.

Misses create water splashes and ripples; hits burst into embers and leave a flame marker. Sunk
ships are revealed and take on a burnt, darkened appearance. Animations respect
`prefers-reduced-motion`. Victory and defeat screens show shots fired, hits, accuracy, enemy ships
sunk, and ships lost.

## Visual assets

The fjord backdrop is original procedural art generated with fixed seeds by
`scripts/art/generate-fjord.py`, without source imagery. It is supplied as 1920px AVIF (12,156
bytes) with WebP fallback (15,484 bytes), and 960px AVIF (5,002 bytes) with WebP fallback (5,510
bytes). The raven emblem is a hand-authored inline SVG inspired by the historical Viking raven
banner.

## Known limitations

- There are no sound effects; optional sound has not been implemented.
- Ship placement has click controls but no drag-and-drop.
- Refreshing starts a new game; progress is not saved.
- There is no public URL yet; deployment is planned for Milestone 4.

## Tech stack

- React 18 + TypeScript, built with Vite
- Plain CSS with design tokens. Ship art is hand-built inline SVG, and fonts (Cinzel, Alegreya Sans, both OFL) are bundled locally.
- Vitest + React Testing Library for unit and component tests
- Playwright for browser-level tests
- GitHub Actions CI: lint, format, typecheck, unit tests, build, browser tests

## Running locally

Requires Node.js 20+.

```bash
npm ci
npm run dev          # http://localhost:5173
```

## Testing

```bash
npm test             # unit + component tests (Vitest)
npx playwright install chromium   # first time only
npm run test:e2e     # browser tests against a production-style build
npm run lint && npm run typecheck
```

## Building

```bash
npm run build                                   # outputs dist/ for a root domain
BASE_PATH=/fleet-command-battleship/ npm run build   # for a GitHub Pages project subpath
```

## Documentation

- [Project plan](docs/PROJECT_PLAN.md): requirements, rules specification, architecture, milestones
- [Debugging report](docs/DEBUGGING_REPORT.md): verified defects with root cause, fix, and verification
