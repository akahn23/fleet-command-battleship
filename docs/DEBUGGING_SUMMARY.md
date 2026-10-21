# Ravenfjord — Debugging Summary

A short, shareable summary of the most instructive real bugs found while building Ravenfjord. The
[full debugging report](DEBUGGING_REPORT.md) lists all 15 confirmed defects with reproduction steps,
evidence and commit references. No bug here is hypothetical, and none was game-breaking.

## How bugs were found

Every change went through a GitHub pull request with automated checks: linting, type checks, 100
unit and component tests, and 31 browser tests on desktop and mobile. The changes were also
reviewed in screenshots and in recorded play-throughs in a real browser. Most of the bugs below
were caught by one of those layers before they ever reached `main`.

## Five examples

### 1. Tests passed on one machine and failed in CI (performance)

- **What was wrong:** two heavy simulation tests passed locally but timed out on GitHub's slower
  CI machines.
- **Why:** the rules engine did quadratic work: it re-checked every ship cell for every candidate
  position. Raising the time limit would only have hidden that.
- **Fix:** the engine now tracks occupied cells in `Set`/`Map` lookups, which made the tests 2–4×
  faster.
- **Validated by:** a passing CI run.
- **Lesson:** a CI-only failure is often a real performance signal, not flakiness.

### 2. Ships drifted off their squares (layout)

- **What was wrong:** rows containing a ship were 5–9 px taller than empty rows, so the ship
  artwork no longer lined up with the cells the rules engine thought it occupied.
- **Why:** grid rows were sized `auto`, so the SVG artwork stretched them.
- **Fix:** the board now uses ten fixed, equal rows.
- **Validated by:** a browser test that checks every ship's edges against its cells. With the old
  CSS restored, the test fails by 10.3 px.

### 3. A merged pull request never reached `main` (delivery)

- **What was wrong:** after two pull requests both showed as merged, the live code still lacked the
  second one's harbour background.
- **Why:** the second PR was stacked on the first PR's branch. The first merged into `main`, and
  the second then merged into the first's already-merged branch.
- **Fix:** an integration PR brought the three existing commits into `main`. No new code was
  needed.
- **Validated by:** `git merge-base --is-ancestor` and a production build serving the new assets.
- **Lesson:** verify what is actually on `main`, not the "merged" badge.

### 4. The battle log couldn't be scrolled by keyboard (accessibility)

- **What was wrong:** once the battle log filled up, keyboard-only players couldn't reach it to
  read older entries.
- **Why:** the list scrolls but contains nothing that can receive focus.
- **Fix:** the list itself is now focusable and shows a visible focus ring.
- **Validated by:** an automated accessibility scan (axe-core) that failed before the fix and passes
  after, and a keyboard test that scrolls the log.

### 5. Sunk-ship labels were too faint to read (accessibility)

- **What was wrong:** the name and "Sunk" label of a sunk ship measured 4.43:1 and 2.62:1 contrast.
  The WCAG minimum is 4.5:1.
- **Why:** the whole row was set to 66% opacity, which dimmed text that was already secondary.
- **Fix:** only the decorative pips are dimmed now, and the label uses a lighter red. The text
  measures 8.78:1 and 7.38:1.
- **Validated by:** a browser test that computes the ratio on a real sunk row.

## Prevention, not just fixes

Several risks were designed out before they could become bugs:

- **Fair opponent:** the computer opponent only receives its own shot results, never the player's
  ship positions, and tests prove its choices don't change when hidden ships move.
- **Rules enforced in one place:** the rules engine rejects illegal actions itself, so the
  rules don't depend on buttons being disabled.
- **No stale moves:** a delayed computer move from a previous game is discarded.
- **Simulation testing:** Milestone 3 added 150 seeded full-game simulations. Before every move,
  they try a fixed set of illegal actions (off-board, repeated and out-of-turn shots; a computer shot on the player's turn; a stale computer move from an old game; and placement actions during battle) and assert the game state does not change.
