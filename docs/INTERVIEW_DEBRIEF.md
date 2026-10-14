# Ravenfjord — 10-Minute Battleship Debrief (speaking notes)

Notes marked **[YOUR VIEW]** need your own words. Everything else comes from the project's pull
requests, commits and documentation.

## A. Product vision and design (≈2 min)

- **The idea:** classic Battleship rules, reimagined as **Ravenfjord**, a Viking naval strategy game:
  Norse longships, a torch-lit harbour, bronze nautical-chart boards and a raven-banner emblem.
- **Why a Viking theme:** **[YOUR VIEW]**
- **Balancing style and simplicity:**
  - The theme changes only the look and wording, never the rules. Five ships (5, 4, 3, 3, 2) on
    two 10×10 boards.
  - The human fires first, one shot per turn, and a hit doesn't earn another shot. Firing at a
    square twice does nothing and doesn't use a turn.
  - Button labels stay plainly functional ("Start Battle", not "Raise Sails"). Flavour lives in
    headings, the battle log ("Saga of the Battle") and the result screens.
  - There's no title screen, so the game opens straight onto ship placement.
- **Original art only:** you supplied mood references, and Devin did not copy them.
  - The emblem, ships and effects are hand-built inline SVG.
  - The harbour backdrop was generated from a text prompt only, and its provenance is
    documented.
  - The fonts are open-licensed (SIL OFL).

## B. Development approach (≈2 min)

- **From assignment to plan:** a written plan with a full rules specification, then gated
  milestones, each delivered as reviewable PRs:
  - **M1, playable game** (PRs #1–#4): project scaffold and CI, a pure TypeScript rules engine
    with a fair computer opponent, the themed interface, and fixes from code review.
  - **M2, smarter opponent and polish** (PR #5): a hunt-and-target opponent, longship artwork,
    combat effects and mobile layout. It ran as an overnight autonomous session within safety
    limits you wrote.
  - **Visual redesign** (PRs #6–#8): the raven emblem, the harbour backdrop and the refined chart
    interface.
  - **M3, QA hardening** (PR #9): simulation and fuzz testing, accessibility fixes, the laptop
    layout and the final debugging report.
  - **M4, deployment and submission:** this milestone.
- **Why Devin Cloud:** **[YOUR VIEW]** One observable fact: Devin worked in its own cloud
  machine, so long autonomous runs (the M2 overnight run) didn't need your laptop.
- **How output was reviewed:**
  - Every change went through a GitHub PR with CI.
  - Devin Review ran automatically on PRs, and its findings were fixed or answered.
  - You approved each merge.
  - Screenshots and screen recordings were attached for visual review.
- **Decisions you made:**
  - Plain CSS rather than Tailwind.
  - Sequential PRs.
  - The rule choices above.
  - Moving the harbour backdrop into its own follow-up PR.
  - Asking for the "Your Waters" heading to be made readable.

## C. Engineering and debugging (≈3 min)

- **Architecture:** a pure TypeScript rules engine, separate from the React interface.
  - Every game action goes through one reducer, which rejects illegal moves itself.
  - The computer receives only a `TargetingView` of its own shot results, never ship positions.
- **Testing layers:**
  - **Unit and component tests:** 100, including 150 seeded full-game simulations that try a fixed set of illegal actions (off-board, repeated and out-of-turn shots; a computer shot on the player's turn; a stale computer move from an old game; and placement actions during battle) before each move.
  - **Browser tests:** 31 Playwright tests on desktop and mobile, including accessibility scans.
  - **Recorded play-throughs:** real-browser runs of complete victories and defeats.
- **Bugs:** 12 real bugs were found and fixed; the
  [debugging summary](DEBUGGING_SUMMARY.md) has the 5 most instructive.
  - **Good stories:** a CI-only timeout caused by quadratic code; ships drifting off their squares,
    caught in screenshots; and a merged PR that never reached `main`, caught by a post-merge
    check.
- **Evaluating AI-generated software:** **[YOUR VIEW]** Observable points you can draw on:
  - Bugs were caught by tests that were shown to fail before each fix.
  - Visual problems were judged from rendered screenshots, not just from measurements: BUG-003
    and BUG-008 passed numeric checks but looked wrong.

## D. Devin product insights (≈2 min)

- **Autonomous work that held up:**
  - The overnight M2 run: plan, implement, test, open the PR and fix review findings.
  - Writing its own regression tests.
  - Diagnosing CI failures from the logs and fixing them. For example, it sped up the
    simulation test without dropping any games or checks.
  - Catching its own integration mistake (BUG-010) during post-merge verification.
- **Where your guidance was needed:**
  - Creative direction and taste: you chose the harbour image and flagged the unreadable heading.
  - Scope and safety limits: no merging, deploying or paid services without your approval.
  - Approving merges and account actions, such as deployment setup.
  - **Honest note:** stacking PR #7 on PR #6 was Devin's choice, and it caused BUG-010. Merging
    stacked PRs safely needs either a human check or a retarget step.
- **Value and limits of agentic engineering:** **[YOUR VIEW]**

## E. Lessons learned (≈1 min)

- **What went well:** **[YOUR VIEW]** For example: milestone gating, the evidence attached to
  every PR, and the rules being enforced in one place.
- **What I'd do differently:** **[YOUR VIEW]** Candidates from the history:
  - Don't stack PRs, or retarget the child PR once its parent merges.
  - Run accessibility scans from the first UI milestone.
- **Connection to Devin's customers:** **[YOUR VIEW]**
