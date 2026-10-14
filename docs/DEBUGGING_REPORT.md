# Ravenfjord — Debugging Report

This log records **genuine defects observed during development** of Ravenfjord, each with its
root cause, fix, and verification evidence. Nothing here is hypothetical.

Risks that were anticipated and designed out _before_ they could occur are listed separately at
the bottom, so they aren't mistaken for bugs found.

## How entries are recorded

| Field                  | Meaning                                                 |
| ---------------------- | ------------------------------------------------------- |
| **ID**                 | `BUG-NNN`, assigned in order of discovery               |
| **Summary**            | One-line description                                    |
| **Found by**           | Unit test, browser test, manual play, CI, or review     |
| **Steps to reproduce** | Minimal steps that trigger the defect                   |
| **Expected vs actual** | What should happen vs. what did happen                  |
| **Root cause**         | The underlying reason, not just the symptom             |
| **Fix**                | What changed, and where                                 |
| **Verification**       | The regression test added and/or manual check performed |
| **Reference**          | Commit and pull request                                 |

## Verified defects

### BUG-001 — Rules-engine tests timed out in CI

| Field                  | Detail                                                                                                                                                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Summary**            | Two property-style tests exceeded Vitest's 5 s default timeout on the GitHub Actions runner                                                                                                                                                           |
| **Found by**           | CI (`verify` job on PR #2)                                                                                                                                                                                                                            |
| **Steps to reproduce** | Run `npm test` on the CI runner at the PR #2 head before the fix                                                                                                                                                                                      |
| **Expected vs actual** | Expected all 63 tests to pass. Actual: "randomFleet … 1,000 seeds" and "full simulated games … 300 seeds" failed with `Test timed out in 5000ms` (locally they passed, at 2.4 s and 3.6 s, so the slower runner pushed them over)                     |
| **Root cause**         | Quadratic work in the engine: `randomFleet` re-validated each of ~180 candidate positions against every cell of every already-placed ship, and `buildTargetingView` scanned the whole shot list once for each of the 100 cells on every computer turn |
| **Fix**                | `src/engine/placement.ts` tracks occupied cells in a `Set`; `src/engine/ai/targetingView.ts` indexes shots in a `Map` once per call. The two heavy tests also get an explicit 15 s budget so a slow runner can't cause a false failure                |
| **Verification**       | Locally the tests dropped from 2,367 ms to 622 ms and from 3,649 ms to 1,638 ms; all 62 engine tests still pass, including the legality and fairness suites; the CI `verify` job was rerun                                                            |
| **Reference**          | Commit `8c90bbb`, [PR #2](https://github.com/akahn23/fleet-command-battleship/pull/2)                                                                                                                                                                 |

### BUG-002 — `createGame({ strategy })` silently ignored the strategy

| Field                  | Detail                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Summary**            | `GameOptions` advertised a `strategy` field, but `createGame` discarded it                                                                                   |
| **Found by**           | Code review (Devin Review on PR #2)                                                                                                                          |
| **Steps to reproduce** | `createGame({ seed: 7, strategy: customAI })`, start a battle, then dispatch `COMPUTER_FIRE` through `gameReducer`                                           |
| **Expected vs actual** | Expected `customAI` to choose the shot. Actual: `randomAI` chose it, because `gameReducer` binds its strategy when the reducer is created, not per game      |
| **Root cause**         | Two injection points for the same thing; only `createReducer(strategy)` was wired up                                                                         |
| **Fix**                | Removed `GameOptions.strategy` (`src/engine/game.ts`). `createReducer(strategy)` is now the single way to choose an opponent, and it survives `NEW_GAME`     |
| **Verification**       | TypeScript now rejects the misleading call; existing `createReducer` tests in `game.test.ts` and `ai/randomAI.test.ts` confirm the injected strategy is used |
| **Reference**          | Commit `5bb0c4d`, [PR #2](https://github.com/akahn23/fleet-command-battleship/pull/2)                                                                        |

### BUG-003 — Ships pushed their board rows out of alignment

| Field                  | Detail                                                                                                                                                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Summary**            | On "Your Waters", rows holding a horizontal ship were taller than empty rows, so ships and the squares beneath them drifted apart                                                                                                                     |
| **Found by**           | Manual visual review of headless-browser screenshots (desktop 1440×900 and mobile 412×915)                                                                                                                                                            |
| **Steps to reproduce** | Open `/?seed=7`, click **Auto-Place Fleet**, then **Start Battle**, and compare row label spacing on "Your Waters"                                                                                                                                    |
| **Expected vs actual** | Expected ten equal square rows. Actual: rows 1–3 were 43 px apart, while rows 4 and 5 (each holding a ship) measured 48 px and 52 px                                                                                                                  |
| **Root cause**         | `grid-template-rows` used `auto` tracks. Each ship is an SVG laid into the same grid, so its intrinsic height fed back into the track size, and a row with a ship grew taller than the others                                                         |
| **Fix**                | `src/components/Board/Board.css`: fixed `minmax(0, 1fr)` tracks on an `aspect-ratio: 1` board, so cells are square and nothing inside a cell can resize its row                                                                                       |
| **Verification**       | New Playwright test "board geometry: square cells and every ship aligned to its squares" (`e2e/gameplay.spec.ts`). With the old CSS it fails with a ship edge 10.3 px off its squares; with the fix it passes on both the desktop and mobile projects |
| **Reference**          | Commit `988d8e9`, PR 3 (themed UI)                                                                                                                                                                                                                    |

## Risks mitigated by design (not bugs)

_These are engineering risks addressed up front. They are not counted as discovered defects._

| Risk                                                                                 | Safeguard                                                                                                                          | Evidence                                                                 |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| A delayed computer move from a finished or restarted game lands in the new game      | `COMPUTER_FIRE` carries `gameId`, and the reducer discards a mismatched `gameId`                                                   | `game.test.ts`: "discards a computer move scheduled for a previous game" |
| The UI could let an illegal action through (out of turn, repeat square, wrong phase) | The reducer rejects every illegal action and returns the identical state object, so the rules don't rely on buttons being disabled | `game.test.ts`: placement, battle-turn, and game-over suites             |
| The computer could "peek" at the player's fleet                                      | The strategy receives only a `TargetingView` (shot outcomes + remaining ship lengths); ship coordinates aren't in that type        | `ai/targetingView.test.ts`, `ai/randomAI.test.ts` "computer fairness"    |
| Random fleet generation might loop forever or produce invalid layouts                | Each ship is chosen from the list of all currently legal positions (no retry loop)                                                 | `placement.test.ts`: 1,000 seeds, all legal                              |
