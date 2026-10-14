# Ravenfjord — Bugs Found and Fixed

Every real defect found while building Ravenfjord is listed here, with what went wrong, why, how
it was fixed, and how the fix was proven. Each one has a regression test or check so it can't
quietly return. Nothing here is hypothetical: risks that were designed out in advance are listed
separately at the end.

| ID      | Bug                                                      | Found by           | Fixed in                                                                       |
| ------- | -------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------ |
| BUG-001 | Rules-engine tests timed out in CI                       | GitHub Actions CI  | `8c90bbb`, [PR #2](https://github.com/akahn23/fleet-command-battleship/pull/2) |
| BUG-002 | `createGame({ strategy })` silently ignored the strategy | Code review, PR #2 | `5bb0c4d`, [PR #2](https://github.com/akahn23/fleet-command-battleship/pull/2) |
| BUG-003 | Ships pushed their board rows out of alignment           | Screenshot review  | `988d8e9`, [PR #3](https://github.com/akahn23/fleet-command-battleship/pull/3) |
| BUG-004 | One misclick on New Battle threw away a battle           | Code review, PR #3 | `3968a75`, [PR #4](https://github.com/akahn23/fleet-command-battleship/pull/4) |
| BUG-005 | Keyboard focus escaped the game-over dialog              | Code review, PR #3 | `3968a75`, [PR #4](https://github.com/akahn23/fleet-command-battleship/pull/4) |
| BUG-006 | Changing a placement after placing it moved the ship     | Code review, PR #2 | `778af09`, [PR #2](https://github.com/akahn23/fleet-command-battleship/pull/2) |
| BUG-007 | Answering the restart prompt dropped keyboard focus      | Code review, PR #4 | PR #4                                                                          |

## BUG-001 — Rules-engine tests timed out in CI

- **What happened:** two heavy tests (1,000 random fleets, 300 full simulated games) passed locally
  but hit Vitest's 5-second limit on the slower GitHub Actions machines.
- **Why:** the engine did quadratic work. Random fleet placement re-checked every candidate
  position against every placed ship cell, and the computer's view of the board re-scanned the
  whole shot list for each of the 100 squares.
- **Fix:** occupied cells are tracked in a `Set` and shots are indexed in a `Map`. The two heavy
  tests also get an explicit 15-second limit.
- **Proof:** locally the tests got 2–4× faster (2.4 s → 0.6 s and 3.6 s → 1.6 s), and CI passes.

## BUG-002 — `createGame({ strategy })` silently ignored the strategy

- **What happened:** the engine offered a `strategy` option for choosing the computer opponent, but
  the game ignored it and always used the random opponent.
- **Why:** there were two ways to pass in a strategy, and only `createReducer(strategy)` was
  actually connected.
- **Fix:** removed the misleading option, so `createReducer(strategy)` is the only way to pass one.
- **Proof:** TypeScript now rejects the old call, and tests confirm the chosen strategy fires the
  shots, including after a restart.

## BUG-003 — Ships pushed their board rows out of alignment

- **What happened:** on the player's board, rows containing a ship were 5–9 px taller than empty
  rows, so ships drifted off their squares.
- **Why:** board rows were sized `auto`, so each ship's SVG artwork stretched the row it sat in.
- **Fix:** the board uses ten fixed, equal rows on a square board, so nothing inside a square can
  resize it.
- **Proof:** a new browser test checks that every square is square and that every ship's edges
  match its squares on desktop and mobile. With the old CSS put back, the test fails with an edge
  10.3 px off.

## BUG-004 — One misclick on New Battle threw away a battle in progress

- **What happened:** the header's New Battle button wiped both fleets and the whole battle at once,
  with no confirmation.
- **Why:** the button restarted the game no matter which phase it was in.
- **Fix:** during a battle it asks "Abandon this battle?" with **Keep Fighting** (selected by
  default) or **Abandon Battle**. During placement and after the game ends, it still restarts
  immediately.
- **Proof:** component tests cover cancelling, confirming, and the placement case with no prompt.

## BUG-005 — Keyboard focus escaped the game-over dialog

- **What happened:** with the Victory/Defeat dialog open, Tab or Shift+Tab moved focus to the
  boards and buttons hidden behind it.
- **Why:** marking the dialog `aria-modal` informs screen readers but doesn't stop the browser's
  Tab key.
- **Fix:** the page behind the dialog is made `inert` while the dialog is open. After **View
  Battlefield**, focus moves to the New Battle button.
- **Proof:** the browser test presses Tab and Shift+Tab with the dialog open and checks that focus
  never leaves it. With the fix removed, that test fails.

## BUG-006 — Changing a placement after placing it moved the ship

- **What happened:** after a ship was placed, changing the original placement object (its
  `origin`) moved the ship on the board without any rule check.
- **Why:** `placeShip` stored the caller's object instead of a copy, which broke the engine's
  no-hidden-changes guarantee.
- **Fix:** `placeShip` stores its own copy of the placement and its origin.
- **Proof:** a regression test changes the original object after placement and checks that the
  board is unchanged.
- **Note:** this was fixed in PR #2 at the time but only added to this report afterwards.

## BUG-007 — Answering the restart prompt dropped keyboard focus

- **What happened:** after **Keep Fighting** or **Abandon Battle**, the focused button disappeared
  and keyboard focus fell back to the page body. This was introduced by the BUG-004 fix.
- **Why:** the prompt replaces the New Battle button, and nothing moved focus back when the prompt
  closed.
- **Fix:** answering the prompt moves focus to New Battle. If the game ends while the prompt is
  open, the result dialog keeps focus instead.
- **Proof:** component tests check where focus lands after each answer.

## Risks designed out from the start (not bugs)

| Risk                                                                              | Safeguard                                                                                               |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| A delayed computer move from an old game lands in a restarted one                 | Each computer move is tagged with its game's ID, and the engine ignores moves from a different game     |
| The screen lets an illegal move through (out of turn, repeat square, wrong phase) | The rules engine itself rejects every illegal action, so the rules don't rely on buttons being disabled |
| The computer opponent "peeks" at the player's ships                               | It only receives shot results and remaining ship lengths; ship positions aren't in what it sees         |
| Random fleet placement loops forever or produces an illegal layout                | Each ship is picked from the list of currently legal positions, with no retry loop                      |
