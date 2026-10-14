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

_No defects recorded yet._

## Risks mitigated by design (not bugs)

_These are engineering risks addressed up front. They are not counted as discovered defects._

_To be filled in as the corresponding safeguards land._
