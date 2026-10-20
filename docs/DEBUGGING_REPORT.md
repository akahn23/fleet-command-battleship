# Ravenfjord — Bugs Found and Fixed

Every real defect found while building Ravenfjord across Milestones 1–5 is listed here: what went
wrong, how to reproduce it, why it happened, how it was fixed, and how the fix was proven. Nothing
here is hypothetical. Risks that were designed out in advance, and areas that were tested without
finding a defect, are listed separately at the end.

Severity: **P0** game-breaking or wrong outcome · **P1** gameplay, AI, turn or state correctness ·
**P2** layout, accessibility, usability or delivery · **P3** cosmetic. No P0 defect was found.

## Interview summary: the most instructive bugs

1. **Tests that passed locally but failed in CI (BUG-001).** Two heavy simulation tests timed out
   only on GitHub's slower machines. Raising the timeout alone would have hidden the cause. The
   real problem was quadratic work in the rules engine, so the fix was better data structures
   (`Set`/`Map` lookups), which made the tests 2–4× faster.
2. **A screenshot caught what the numbers missed (BUG-003).** Ships drifted off their squares
   because ship artwork stretched `auto`-sized grid rows. A browser test now checks every ship's
   edges against its cells, and it fails with the old CSS put back.
3. **"Merged" did not mean "on main" (BUG-010).** A follow-up PR stacked on another PR's branch
   merged into that already-merged branch, so its changes never reached `main`. A post-merge
   ancestry check (`git merge-base --is-ancestor`) caught it, and the fix was an integration PR,
   not new code.
4. **An automated scan found what manual play couldn't (BUG-011, BUG-012).** An axe-core scan
   showed that the battle log couldn't be scrolled by keyboard once it overflowed. A measured
   contrast check showed that sunk-ship rows fell below WCAG's 4.5:1. Both are now guarded by
   browser tests that were shown to fail before the fix and pass after.

## Summary

| ID      | Sev. | Bug                                                          | Found by                   | Fixed in                                                                        |
| ------- | ---- | ------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------- |
| BUG-001 | P2   | Rules-engine tests timed out in CI                           | GitHub Actions CI          | `8c90bbb`, [PR #2](https://github.com/akahn23/fleet-command-battleship/pull/2)  |
| BUG-002 | P2   | `createGame({ strategy })` silently ignored the strategy     | Code review, PR #2         | `5bb0c4d`, [PR #2](https://github.com/akahn23/fleet-command-battleship/pull/2)  |
| BUG-003 | P2   | Ships pushed their board rows out of alignment               | Screenshot review          | `988d8e9`, [PR #3](https://github.com/akahn23/fleet-command-battleship/pull/3)  |
| BUG-004 | P2   | One misclick on New Battle threw away a battle               | Code review, PR #3         | `3968a75`, [PR #4](https://github.com/akahn23/fleet-command-battleship/pull/4)  |
| BUG-005 | P2   | Keyboard focus escaped the game-over dialog                  | Code review, PR #3         | `3968a75`, [PR #4](https://github.com/akahn23/fleet-command-battleship/pull/4)  |
| BUG-006 | P1   | Changing a placement after placing it moved the ship         | Code review, PR #2         | `778af09`, [PR #2](https://github.com/akahn23/fleet-command-battleship/pull/2)  |
| BUG-007 | P2   | Answering the restart prompt dropped keyboard focus          | Code review, PR #4         | [PR #4](https://github.com/akahn23/fleet-command-battleship/pull/4)             |
| BUG-008 | P2   | Hit and miss markers were too small and faint on phones      | M2 browser review          | `a8b70b4`, [PR #5](https://github.com/akahn23/fleet-command-battleship/pull/5)  |
| BUG-009 | P2   | Turn banner wrapped after the font loaded, shifting the page | Redesign performance check | `7019c9a`, [PR #6](https://github.com/akahn23/fleet-command-battleship/pull/6)  |
| BUG-010 | P2   | Harbour backdrop PR merged but never reached `main`          | Post-merge QA              | [PR #8](https://github.com/akahn23/fleet-command-battleship/pull/8) (`929ae90`) |
| BUG-011 | P2   | Battle log could not be scrolled by keyboard                 | M3 axe-core scan           | `3bfc345`, M3 PR                                                                |
| BUG-012 | P2   | Sunk-ship rows in the fleet panels failed contrast           | M3 measured contrast check | `3bfc345`, M3 PR                                                                |
| BUG-013 | P2   | R rotated a ship behind the How to Play dialog               | M5 browser QA, PR #11      | M5 regression test                                                              |

---

## BUG-001 — Rules-engine tests timed out in CI (P2)

- **Problem:** two heavy tests (1,000 random fleets and 300 full simulated games) passed locally but
  failed on GitHub Actions.
- **Reproduce:** run `npm test` on a GitHub Actions runner at the PR #2 commit before `8c90bbb`.
- **Expected vs actual:** expected the suite to pass, as it did locally; both tests hit Vitest's
  5-second limit.
- **Root cause:** the engine did quadratic work. Random fleet placement re-checked every candidate
  position against every placed ship cell, and the computer's view of the board re-scanned the
  whole shot list for each of the 100 squares. CI machines are about 1.5–2× slower, which pushed
  both tests over the limit.
- **Fix:** occupied cells are tracked in a `Set` and shots are indexed in a `Map`. The two heavy
  tests also get an explicit 15-second limit.
- **Verification:** locally the tests got 2–4× faster (2.4 s → 0.6 s and 3.6 s → 1.6 s), and CI
  passes.

## BUG-002 — `createGame({ strategy })` silently ignored the strategy (P2)

- **Problem:** the engine offered a `strategy` option for choosing the computer opponent, but the
  game ignored it.
- **Reproduce:** create a game with `createGame({ seed, strategy })` and let the computer fire.
- **Expected vs actual:** expected the given strategy to choose the computer's shots; the random
  opponent always fired instead.
- **Root cause:** there were two ways to pass in a strategy, and only `createReducer(strategy)` was
  actually connected.
- **Fix:** removed the misleading option, so `createReducer(strategy)` is the only way to pass one.
- **Verification:** TypeScript now rejects the old call, and tests confirm the chosen strategy
  fires the shots, including after a restart.

## BUG-003 — Ships pushed their board rows out of alignment (P2)

- **Problem:** on the player's board, rows containing a ship were 5–9 px taller than empty rows,
  so ships drifted off their squares.
- **Reproduce:** place a fleet and compare the height of rows with and without ships.
- **Expected vs actual:** expected ten equal rows with every ship exactly covering its squares;
  rows with ships grew and the artwork no longer lined up with its cells.
- **Root cause:** board rows were sized `auto`, so each ship's SVG artwork stretched the row it sat
  in.
- **Fix:** the board uses ten fixed, equal rows (`minmax(0, 1fr)`) on a square board, so nothing
  inside a square can resize it.
- **Verification:** a browser test checks that every square is square and that every ship's edges
  match its squares on desktop and mobile. With the old CSS put back, the test fails with an edge
  10.3 px off.

## BUG-004 — One misclick on New Battle threw away a battle in progress (P2)

- **Problem:** the header's New Battle button wiped both fleets and the whole battle at once, with
  no confirmation.
- **Reproduce:** start a battle, fire a few shots, then click New Battle.
- **Expected vs actual:** expected a chance to cancel; the battle was discarded immediately.
- **Root cause:** the button restarted the game no matter which phase it was in.
- **Fix:** during a battle it asks "Abandon this battle?" with **Keep Fighting** (selected by
  default) or **Abandon Battle**. During placement and after the game ends, it still restarts
  immediately.
- **Verification:** component tests cover cancelling, confirming, and the placement case with no
  prompt.

## BUG-005 — Keyboard focus escaped the game-over dialog (P2)

- **Problem:** with the Victory/Defeat dialog open, Tab and Shift+Tab moved focus to the boards
  and buttons hidden behind it.
- **Reproduce:** finish a game, then press Tab repeatedly while the dialog is open.
- **Expected vs actual:** expected focus to stay inside the dialog; it moved to controls behind it.
- **Root cause:** marking the dialog `aria-modal` informs screen readers but doesn't stop the
  browser's Tab key.
- **Fix:** the page behind the dialog is made `inert` while the dialog is open. After **View
  Battlefield**, focus moves to the New Battle button.
- **Verification:** the browser test presses Tab and Shift+Tab with the dialog open and checks that
  focus never leaves it. With the fix removed, that test fails.

## BUG-006 — Changing a placement after placing it moved the ship (P1)

- **Problem:** after a ship was placed, changing the original placement object (its `origin`)
  moved the ship on the board without any rule check.
- **Reproduce:** call `placeShip(board, placement)`, then change `placement.origin`.
- **Expected vs actual:** expected the placed ship to stay where it was validated; it moved with
  the caller's object.
- **Root cause:** `placeShip` stored the caller's object instead of a copy, which broke the
  engine's no-hidden-changes guarantee. The UI never changed a placement after passing it in, so
  players could not trigger this.
- **Fix:** `placeShip` stores its own copy of the placement and its origin.
- **Verification:** a regression test changes the original object after placement and checks that
  the board is unchanged.
- **Note:** this was fixed in PR #2 at the time but only added to this report afterwards.

## BUG-007 — Answering the restart prompt dropped keyboard focus (P2)

- **Problem:** after **Keep Fighting** or **Abandon Battle**, the focused button disappeared and
  keyboard focus fell back to the page body. The BUG-004 fix introduced this.
- **Reproduce:** in battle, press New Battle with the keyboard, then answer the prompt.
- **Expected vs actual:** expected focus to land on a sensible control; it fell back to the page
  body.
- **Root cause:** the prompt replaces the New Battle button, and nothing moved focus back when the
  prompt closed.
- **Fix:** answering the prompt moves focus to New Battle. If the game ends while the prompt is
  open, the result dialog keeps focus instead.
- **Verification:** component tests check where focus lands after each answer.

## BUG-008 — Hit and miss markers were too small and faint on phones (P2)

- **Problem:** on phones, shots were hard to see on the board.
- **Reproduce:** at 360×740, fire a few shots and wait 1.5 s for the animations to settle.
- **Expected vs actual:** expected clearly visible markers; settled miss and hit markers measured
  only about 41.8% and 39.7% of the cell width, and the miss ring's colour was low-contrast.
- **Root cause:** markers had 12% padding, and the miss rings used small strokes and the muted
  `--mist` colour. These settings were already present at the M1 baseline `ac45e40`; the bug was
  found during Milestone 2 browser review, before merge.
- **Fix:** reduced the marker inset, enlarged the miss rings and hit flame, and switched the miss
  colour to higher-contrast parchment.
- **Verification:** settled miss and hit markers now measure 56.7% and 55.7% of the cell width. A
  mobile E2E test asserts that both are at least 40%.

## BUG-009 — Turn banner wrapped after the font loaded, shifting the page (P2)

- **Problem:** on phones, the boards jumped down 24 px shortly after the page loaded.
- **Reproduce:** cold-load the production build of the visual-redesign branch before `7019c9a` at
  390×844 and record layout shift.
- **Expected vs actual:** expected a stable layout (cumulative layout shift, CLS, was 0.022 before
  the redesign); CLS was 0.13.
- **Root cause:** the display font, Cinzel, is wider than its fallback. The redesign's wider
  letter-spacing and padding left the turn-banner headline on one line under the fallback font
  and on two lines once Cinzel loaded.
- **Fix:** at ≤520 px, reduced the banner's horizontal padding and reserved `min-height: 3em`
  (two lines) for the headline.
- **Verification:** the banner is 74 px tall under both fonts, and CLS dropped to 0.018.
  Recorded in `docs/VISUAL_REDESIGN_QA.md` (QA-001).

## BUG-010 — Harbour backdrop PR merged but never reached `main` (P2, delivery)

- **Problem:** after PRs #6 and #7 were both shown as merged, `main` still had the older fjord
  backdrop and the less legible board headings.
- **Reproduce:** at `f99ede9` (`main` after #6), run
  `git merge-base --is-ancestor 9ba47cc origin/main`. It fails, while the same check against the
  PR #6 branch succeeds.
- **Expected vs actual:** expected both PRs' changes on `main`; only PR #6's were there.
- **Root cause:** PR #7 was stacked on PR #6, so its base was PR #6's branch rather than `main`.
  PR #6 merged first, then PR #7 merged into PR #6's already-merged branch (`ba02a8b`).
- **Fix:** [PR #8](https://github.com/akahn23/fleet-command-battleship/pull/8) brought PR #7's
  three unchanged commits into `main`. No new code was needed.
- **Verification:** after PR #8, `9ba47cc` is an ancestor of `main` (`929ae90`). The production
  build serves the harbour assets (141 KB desktop and 47 KB mobile AVIF, HTTP 200), and the smoke
  test asserts them.
- **Prevention:** after any stacked merge, retarget the child PR to `main` and check ancestry
  instead of trusting the PR's "merged" badge.

## BUG-011 — Battle log could not be scrolled by keyboard (P2, accessibility)

- **Problem:** once the battle log overflowed its box, keyboard-only players could not reach it to
  read older entries (WCAG 2.1.1, Keyboard).
- **Reproduce:** start a battle and fire about 8 shots so the log overflows, then press Tab
  through the page. Focus never reaches the log, so arrow keys can't scroll it.
- **Expected vs actual:** expected the scrollable log to be focusable; axe-core 4.10 reported
  `scrollable-region-focusable` (serious) during battle and after the game, at 1440×900 and
  390×844.
- **Root cause:** the log's `<ol>` scrolls (`overflow-y: auto` with a maximum height) but contains
  no focusable content, so browsers give keyboard users no way to scroll it.
- **Fix:** the list is focusable (`tabIndex={0}`), keeps its "Battle log" label, and shows the
  standard focus ring when focused by keyboard.
- **Verification:** a new axe-core browser test scans placement, an overflowing battle and the
  victory dialog on desktop and mobile. It failed on the battle scan before the fix and passes
  after. A keyboard test focuses the log, presses ArrowDown and checks that it scrolled.

## BUG-012 — Sunk-ship rows in the fleet panels failed contrast (P2, accessibility)

- **Problem:** the name and "Sunk" label of a sunk ship were hard to read (WCAG 1.4.3, Contrast).
- **Reproduce:** sink any ship and measure the sunk row's text against the panel background.
- **Expected vs actual:** expected at least 4.5:1 for this 14–15 px text. The ship name measured
  4.43:1 and the red "Sunk" label 2.62:1.
- **Root cause:** the whole sunk row had `opacity: 0.66`, which dimmed text that was already the
  secondary colour, and the label used the error red `--invalid`.
- **Fix:** only the damage pips are dimmed. The name keeps its strike-through in the readable
  secondary colour, and the label uses a lighter red (`#e58a7e`).
- **Verification:** the ship name now measures 8.78:1 and the label 7.38:1. A browser test computes
  both ratios on a real sunk row and requires at least 4.5:1. It failed at 4.43:1 before the fix.

## BUG-013 — R rotated a ship behind the How to Play dialog (P2, low)

- **Severity:** low.
- **Problem:** the placement rotation shortcut could change a ship while the How to Play dialog was
  open.
- **Reproduce:** during placement, open How to Play and press `R`.
- **Expected vs actual:** the modal should isolate the keyboard, but the rotation shortcut fired
  behind it.
- **Root cause:** a global `window` keydown listener isn't blocked by `inert`, and the shortcut
  handler checked only the game phase.
- **Fix and verification:** the handler now returns while the page is inert. A regression test
  confirms `R` leaves the orientation unchanged with the dialog open and rotates after Begin closes
  it.
- **Found by:** M5 browser QA on PR #11.

---

## Tested in Milestone 3 with no defect reproduced

- **Ship placement:** exactly five ships with lengths 5, 4, 3, 3 and 2; legal horizontal and
  vertical placement; touching ships allowed; overlap and off-board placement rejected; rotation
  near edges shows an invalid preview and places nothing.
  - 100 seeds × 200 random placement attempts matched an independent rules checker exactly.
  - Auto-placement produced legal fleets across 1,000 seeds.
- **Turns and combat:** 150 simulated full games tried a fixed set of illegal actions before each move:
  repeated, off-board and out-of-turn shots, a computer shot on the player's turn, a stale computer
  move from an old game, and placement actions during battle. All were rejected without changing state, and the invariants held:
  strict alternation, unique shots, a single game-over event, the correct winner, and no shots
  after the game ended.
  - Rapid clicks fire exactly one shot.
  - Abandoning a battle while the computer is aiming cancels its pending shot.
  - Clicking after the game ends does nothing.
- **Computer opponent:** follows hits along a line when that line runs into a board edge. Against
  a fleet of five touching ships it always finished in fewer than 100 legal, non-repeating shots.
  The earlier tests still hold: it only sees shot results, never ship positions.
- **In the browser:** placement, rotation, keyboard play, firing, hits, misses, sinking, victory,
  defeat and restarting; desktop, laptop, tablet and phone sizes; and reduced motion.

## Risks designed out from the start (not bugs)

The Devin Review flag on PR #5 (reduced-motion E2E coverage stopped at placement) was a test
coverage gap, not a bug; the battle-phase test now covers miss, hit, and sink effects.

| Risk                                                                              | Safeguard                                                                                                 |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| A delayed computer move from an old game lands in a restarted one                 | Each computer move is tagged with its game's ID, and the engine ignores moves from a different game       |
| The screen lets an illegal move through (out of turn, repeat square, wrong phase) | The rules engine itself rejects illegal actions itself, so the rules don't rely on buttons being disabled |
| The computer opponent "peeks" at the player's ships                               | It only receives shot results and remaining ship lengths; ship positions aren't in what it sees           |
| Random fleet placement loops forever or produces an illegal layout                | Each ship is picked from the list of currently legal positions, with no retry loop                        |
| A tester replays a known enemy layout in the live game                            | The `?seed=` replay hook only works in development and test builds, not production                        |

## Known limitations (not defects)

- The game runs entirely in the browser, so a player using developer tools could inspect the
  enemy fleet in memory. Preventing that would need a server, which is out of scope.
- Vite prints an "asset placeholder didn't resolve at build time" warning for the backdrop's
  `image-set()` CSS. The built CSS was checked: every image URL is resolved, so the warning is
  cosmetic.
- Responsive checks ran in desktop Chromium at phone and tablet sizes, not on physical devices
  or in Safari or Firefox.
