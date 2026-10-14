# Ravenfjord

**Battleship reimagined as a Viking naval strategy game.**

Command a fleet of Norse longships against a computer-controlled jarl on the cold seas of the
north. The rules are classic Battleship. The look and feel are mist, fjords, weathered timber,
and bronze.

> Status: **Milestone 1 in progress**. See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md).

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
