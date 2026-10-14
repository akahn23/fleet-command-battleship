# Ravenfjord visual redesign — independent browser QA

## Scope and method

Tested branch `devin/1791981606-visual-redesign`, HEAD `7019c9a`, from `/home/ubuntu/repos/rf-main`, using the existing Vite server at `http://localhost:5173`.

This was a real headed Chromium browser pass, not a unit-test or code-review report. A single recording covers desktop placement, a complete victorious game, and restart flows at 1280×800. Separate UI-driven follow-ups exercise 1440×900, 1024×768, 390×844 and 360×740, reduced motion, and DevTools network evidence. All screenshots in this report are from the redesign checkout.

- Actions used visible buttons/cells and keyboard input. Playwright/CDP supplied screenshots, viewport/media emulation, public DOM measurements, and console/network capture. No hidden game state was read or injected.
- The nonproduction `?seed=7` URL makes replay reproducible. The complete game used coordinates learned from the earlier public seed-7 playthrough; it is a gameplay/visual regression check, not a new blind AI-fairness experiment.
- Public board marker counts, fleet text, and battle-log snapshots were collected after accepted shots. The winning sequence was B1, A1–A5, F1–I1, J5–J6, B7–B9, E10–G10.
- Inspected full-page screenshots for readability, clipping and overlap; checked geometry as well as document width. Mobile tests used desktop Chromium viewport emulation, not physical phones.
- Network capture began before a cache-disabled reload. The actual selected AVIF resources were also inspected in Chrome DevTools.
- No application code was changed, no dependencies installed, no server started, and no commits made. Port 4173 was not used.

### Execution caveats and coverage limits

The helper initially used incorrect selectors (`.ship-overlay`, `.placement-dock`, and `gridcell`) and an incorrect aggregate-hit text expectation. These caused selector timeouts/false helper assertions, not application failures. Checks were rerun using `.ship`, button roles, and the actual aggregate “1 hit” text. A later fresh-game effect capture initially landed on a miss because New Battle changes the fleet; the hit capture was repeated after reloading the deterministic seed. These corrections are visible as pauses in the recording and are retained in the raw assertion log.

All requested functional areas were ultimately exercised. This pass completed victory, not a new defeat game. It did not independently rerun the production cold-load CLS measurements or force a browser without AVIF support to test WebP fallback. The supplied QA-001 measurements below remain phase-1 evidence, not measurements from this pass. No claim of exhaustive AI fairness, browser compatibility, or universal game-state coverage is made.

## Results

| Area                                  | Result | Observed runtime evidence                                                                                                                                                                                                                                             |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ship selection and placement          | Passed | Selected cards and placed ships by clicking. R produced a vertical Dragonship at J3–J6; Rotate Ship returned to horizontal.                                                                                                                                           |
| Invalid placement                     | Passed | H1 showed a red off-board preview and was rejected. With Great Longship at C3–G3, placing Dragonship from A3 showed a red overlap preview and collision notice; existing ship remained unchanged.                                                                     |
| Lift, auto-place, clear, Start gating | Passed | Clicked J4 to return Dragonship to harbour. Auto-Place produced five ships; Clear removed them. Start was disabled with zero and four ships and enabled with five.                                                                                                    |
| Turn order and AI replies             | Passed | Player started; immediate banner changed to “The enemy takes aim…” before the pending reply, then back to the player. The complete 18-shot victory had exactly 17 computer replies; no reply after the winning shot.                                                  |
| Repeated cell                         | Passed | Re-clicking fired A1 preserved both boards, log, fleet text and turn after waiting longer than the 650ms reply delay.                                                                                                                                                 |
| Combat effects and alignment          | Passed | Fresh misses ran splash/ripple/droplet animations and settled to rings. Fresh hits ran impact/flame animations. Marker grid positions matched every accepted target. Sinking revealed burnt ship silhouettes over the sunk cells.                                     |
| Enemy privacy and status              | Passed | Unsunk-hit log entries omitted ship classes. Across all 18 main-game snapshots, Enemy Fleet exposed aggregate hits and Afloat/Sunk only, with no per-class “Damaged” disclosure. Sink events named the class and updated the panel.                                   |
| Full game / statistics                | Passed | “Valhalla Awaits”: **18 shots, 17 hits, 94% accuracy, 5 enemy ships sunk, 2 ships lost**. All values matched public board markers and revealed sunk ships.                                                                                                            |
| Restart                               | Passed | Result-dialog New Battle returned to empty placement with Start disabled. Mid-battle New Battle showed “Abandon this battle?”; Keep Fighting preserved state; Abandon Battle reset it.                                                                                |
| Hover and focus                       | Passed | Active unexplored enemy cell received bronze hover fill/inset border. Keyboard focus showed a 3px button ring and 2px cell ring; arrow keys moved cell focus.                                                                                                         |
| Visual redesign                       | Passed | Raven banner and wordmark legible; fjord backdrop visible; board coordinate labels/gridlines, panels, cards and controls readable at all four requested sizes. No clipping or overlap reproduced.                                                                     |
| Responsive placement/battle           | Passed | No horizontal overflow at all four sizes. Mobile enemy board came first. Dock selection, rotation, manual placement/lifting, auto-place and battle firing worked at both mobile sizes.                                                                                |
| Board-water motion                    | Passed | Computed `animation-name: none` on both water layers at every requested viewport size.                                                                                                                                                                                |
| Reduced motion                        | Passed | Explicit media-query match; fresh miss, hits and sink remained playable. Zero running animations; mist, water, banner pseudo-element, splash, impact, flame, sunk SVG and smoke had `animation-name: none`. Static screenshots one second apart were pixel-identical. |
| Console and assets                    | Passed | Zero browser console errors, uncaught page errors, failed requests, or HTTP responses >=400 during monitored testing. `fjord-1920.avif` and `fjord-960.avif` both loaded with HTTP **200**, including visible DevTools evidence.                                      |

### Responsive measurements

The Linux desktop browser reserves a 15px vertical scrollbar. Document width equaled client width, rather than exceeding the requested viewport.

| Viewport | Document/client width | Cell width | Emblem width | Board ordering |
| -------- | --------------------: | ---------: | -----------: | -------------- |
| 1440×900 |         1425 / 1425px |    42.80px |         64px | Side by side   |
| 1024×768 |         1009 / 1009px |    41.25px |         64px | Side by side   |
| 390×844  |           375 / 375px |    31.89px |         44px | Enemy first    |
| 360×740  |           345 / 345px |    28.89px |         44px | Enemy first    |

No button, heading or board frame extended outside horizontal viewport bounds. Long fleet names at 1024px wrapped within their panels rather than overlapping adjacent content.

## Bugs

**No new genuinely reproduced application defects were found in this pass.**

### Already-fixed regression — supplied phase-1 record, retained verbatim

QA-001 (fixed in 7019c9a): mobile layout shift on font load. Repro: cold-load the production build at 390x844. Observed CLS 0.13: the Cinzel font swap made the turn-banner headline wrap to a second line, pushing the boards down 24px. Root cause: the redesign's wider headline letter-spacing and padding left the headline one line wide under the fallback font but two lines under Cinzel. Fix: at ≤520px, reduced the turn-banner horizontal padding and reserved `min-height: 3em` (2 lines) for the headline. Verified: banner height is 74px under both fonts, and CLS dropped to 0.018 (pre-redesign baseline 0.022).

This paragraph is the requested phase-1 finding, not a newly reproduced defect. This pass visually checked the redesigned mobile layouts; it did not repeat the production CLS experiment.

## Visual evidence

| Desktop — 1440px battle                                                                                                               | Mobile — 390px battle                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| ![1440px redesigned battlefield](https://app.devin.ai/attachments/2c7a9457-089e-493d-8c29-081391df64c9/1440-battle.png#w=1440&h=1078) | ![390px enemy-first battle](https://app.devin.ai/attachments/389f6390-3bf8-4e19-83af-728bea7578ca/390-battle.png#w=390&h=1808) |

| Victory — statistics matched public boards                                                                                        | Reduced motion — static final effects                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| ![Verified victory dialog](https://app.devin.ai/attachments/25024cde-16c8-4cba-ae3c-7430f14a6117/victory-dialog.png#w=1280&h=800) | ![Reduced-motion battle](https://app.devin.ai/attachments/5145e938-7e1e-4418-bfb4-437cb5ccf3ff/reduced-motion.png#w=1440&h=900) |

### Local artifact paths

Recording: `/home/ubuntu/screencasts/ravenfjord-redesign-qa/ravenfjord-redesign-qa-edited.mp4`

| Evidence — left                                                         | Evidence — right                                                                 |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **1440 placement:** `/home/ubuntu/rf-visual-qa/1440-placement.png`      | **1440 battle:** `/home/ubuntu/rf-visual-qa/1440-battle.png`                     |
| **1024 placement:** `/home/ubuntu/rf-visual-qa/1024-placement.png`      | **1024 battle:** `/home/ubuntu/rf-visual-qa/1024-battle.png`                     |
| **390 placement:** `/home/ubuntu/rf-visual-qa/390-placement.png`        | **390 battle:** `/home/ubuntu/rf-visual-qa/390-battle.png`                       |
| **360 placement:** `/home/ubuntu/rf-visual-qa/360-placement.png`        | **360 battle:** `/home/ubuntu/rf-visual-qa/360-battle.png`                       |
| **Off-board preview:** `/home/ubuntu/rf-visual-qa/invalid-offboard.png` | **Overlap preview:** `/home/ubuntu/rf-visual-qa/invalid-overlap.png`             |
| **Button focus:** `/home/ubuntu/rf-visual-qa/button-focus.png`          | **Enemy cell focus/hover:** `/home/ubuntu/rf-visual-qa/enemy-keyboard-focus.png` |
| **Enemy turn:** `/home/ubuntu/rf-visual-qa/enemy-turn.png`              | **Unsunk feedback:** `/home/ubuntu/rf-visual-qa/unsunk-feedback.png`             |
| **Splash:** `/home/ubuntu/rf-visual-qa/splash-instant.png`              | **Burst:** `/home/ubuntu/rf-visual-qa/burst-instant.png`                         |
| **Settled flame:** `/home/ubuntu/rf-visual-qa/burst-final.png`          | **Sunk feedback:** `/home/ubuntu/rf-visual-qa/sunk-feedback.png`                 |
| **Victory:** `/home/ubuntu/rf-visual-qa/victory-dialog.png`             | **Restart confirmation:** `/home/ubuntu/rf-visual-qa/restart-confirmation.png`   |
| **Reduced motion:** `/home/ubuntu/rf-visual-qa/reduced-motion.png`      | **One second later:** `/home/ubuntu/rf-visual-qa/reduced-motion-plus-1s.png`     |
| **AVIF HTTP 200:** `/home/ubuntu/rf-visual-qa/avif-network-200.png`     | **Reset placement:** `/home/ubuntu/rf-visual-qa/abandon-reset.png`               |

Supporting data under `/home/ubuntu/rf-visual-qa/`: `final-state.json` contains the completed main game; the first 18 entries of `history.json` are the main playthrough, with follow-up games afterward. Also retained: `responsive-metrics.json`, `reduced-motion.json`, `network.jsonl`, `console-errors.jsonl`, `request-failures.jsonl`, effect animation snapshots and `assertions.txt` (including corrected helper failures).
