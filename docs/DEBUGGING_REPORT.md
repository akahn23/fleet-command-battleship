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

## Risks mitigated by design (not bugs)

_These are engineering risks addressed up front. They are not counted as discovered defects._

| Risk                                                                                 | Safeguard                                                                                                                          | Evidence                                                                 |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| A delayed computer move from a finished or restarted game lands in the new game      | `COMPUTER_FIRE` carries `gameId`, and the reducer discards a mismatched `gameId`                                                   | `game.test.ts`: "discards a computer move scheduled for a previous game" |
| The UI could let an illegal action through (out of turn, repeat square, wrong phase) | The reducer rejects every illegal action and returns the identical state object, so the rules don't rely on buttons being disabled | `game.test.ts`: placement, battle-turn, and game-over suites             |
| The computer could "peek" at the player's fleet                                      | The strategy receives only a `TargetingView` (shot outcomes + remaining ship lengths); ship coordinates aren't in that type        | `ai/targetingView.test.ts`, `ai/randomAI.test.ts` "computer fairness"    |
| Random fleet generation might loop forever or produce invalid layouts                | Each ship is chosen from the list of all currently legal positions (no retry loop)                                                 | `placement.test.ts`: 1,000 seeds, all legal                              |
