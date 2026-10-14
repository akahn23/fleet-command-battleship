# Ravenfjord — Cognition M1 Battleship Submission

## A. Required links

1. **Play Ravenfjord:** https://ravenfjord.vercel.app
2. **Public GitHub repository:** https://github.com/akahn23/fleet-command-battleship
3. **Debugging report:** https://github.com/akahn23/fleet-command-battleship/blob/main/docs/DEBUGGING_SUMMARY.md
   ([full report](https://github.com/akahn23/fleet-command-battleship/blob/main/docs/DEBUGGING_REPORT.md))

## B. Project summary

Ravenfjord is a browser game of Battleship played against a computer opponent and reimagined as a
Viking naval strategy game. Players place five Norse longships on a 10×10 chart, either by hand or
automatically, then trade shots with a computer jarl until one fleet lies on the seabed. The
classic rules are unchanged: the theme lives in original SVG ship artwork, a torch-lit harbour
backdrop, and Norse battle-log narration. It is built with React 18, TypeScript and Vite. A pure
TypeScript rules engine is tested with Vitest and Playwright.

## C. Engineering summary

- **Milestones:** each milestone was delivered through reviewed GitHub pull requests:
  - **M1, playable game** (PRs #1–#4)
  - **M2, smarter opponent and visual polish** (PR #5)
  - **Visual redesign** (PRs #6–#8)
  - **M3, QA hardening** (PR #9)
  - **M4, deployment and submission:** this milestone.
- **Computer opponent:** a hunt-and-target strategy. It searches with a parity pattern, follows up
  on the squares next to a hit, then continues along the ship's line once it knows the direction.
  It only ever sees its own shot results and which ships remain, never the player's ship
  positions, and tests prove this.
- **Testing:** 100 unit and component tests and 31 browser tests, plus recorded
  play-throughs of full victories and defeats in a real browser.
  - **Unit and component tests** include 150 seeded full-game simulations that try a fixed set of illegal actions (off-board, repeated and out-of-turn shots; a computer shot on the player's turn; a stale computer move from an old game; and placement actions during battle) before each move.
  - **Browser tests** cover desktop and mobile, including accessibility scans.
- **Debugging method:** each real defect was reproduced, its root cause found, fixed with the
  smallest change, and covered by a regression test shown to fail before the fix. 12 real bugs
  are documented.
- **Delivery:** every change went through a GitHub PR with CI (lint, format, type check, unit
  tests, build and browser tests) and automated code review. Vercel builds and deploys `main`
  automatically.

## D. Final quality status

| Item               | Status                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release commit     | `fa51121` (merge of PR #9). The live bundles match a build of this commit. PR #10 changes docs only.                                                                            |
| Public deployment  | PASS: Vercel production, anonymous access verified, full victory and defeat played on the live site                                                                             |
| GitHub CI          | PASS: [GitHub Actions](https://github.com/akahn23/fleet-command-battleship/actions) `verify` check (lint, format, type check, unit tests, build, browser tests)                 |
| Automated tests    | 100/100 unit and component tests; 31 browser tests passed, 0 failed, 1 skipped (desktop-only layout test on mobile); `npm audit`: 0 vulnerabilities                             |
| Outstanding issues | No known bugs. Limitations: the game is client-side (the enemy fleet can be inspected with developer tools); verified in Chromium only, not Safari, Firefox or physical phones. |

## E. Interview materials (supporting, not required)

- [10-minute debrief notes](INTERVIEW_DEBRIEF.md)
- [Final gameplay screenshot](assets/ravenfjord-battle.webp)
- Gameplay recording: [43-second playthrough on the live site](assets/ravenfjord-gameplay.mp4)

## F. Copy-ready email to the hiring manager

> **Subject:** Battleship technical assignment — Ravenfjord
>
> Hi [Hiring manager],
>
> I've completed the Battleship technical assignment. Here are the three deliverables:
>
> 1. Play the game: https://ravenfjord.vercel.app
> 2. Source code: https://github.com/akahn23/fleet-command-battleship
> 3. Debugging report: https://github.com/akahn23/fleet-command-battleship/blob/main/docs/DEBUGGING_SUMMARY.md
>
> I built Ravenfjord with Devin: classic Battleship, reimagined as a Viking naval strategy game,
> against a hunt-and-target computer opponent. The debugging report covers the real bugs we
> found, why they happened, and how each fix was verified with tests.
>
> I look forward to walking you through it.
>
> Best,
> [Your name]

## Requirements checklist

- [x] Public Battleship game deployed: https://ravenfjord.vercel.app (Vercel, deploys `main` automatically)
- [x] Computer AI opponent playable: full victory and defeat played on the public site
- [x] Public game URL verified: loads with no cookies and no login; zero console errors or failed requests
- [x] All final tests passing: 100/100 unit and component; 31 browser passed, 1 skipped (a desktop-only layout test, skipped on the mobile project)
- [x] Public GitHub repository accessible
- [x] Final approved code present on `main`: the live JS and CSS bundles match a build of `fa51121`
- [ ] README complete: done in PR #10; live once PR #10 is merged
- [x] Debugging report finalized
- [x] Debugging report publicly accessible: full report on `main`; the two-page summary goes live when PR #10 is merged
- [ ] Required submission links verified: game and repo verified; the summary link returns 404 until PR #10 is merged
- [x] Final gameplay screenshot captured
- [x] Interview debrief notes prepared (personal-perspective points marked [YOUR VIEW])
- [x] Copy-ready submission email prepared

> **Reminder:** the separate 40-minute customer-facing Devin demo has its own requirements and is
> not covered by this submission.
