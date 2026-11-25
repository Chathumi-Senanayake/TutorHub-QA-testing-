# TutorHub — QA Testing (EC4206 Software Testing & Quality Assurance)

This folder applies every technique taught in the module to the real TutorHub codebase
(`backend/`, `frontend/`), organised by the group's existing 5-member split (same split
used in the group's main EC4206 task-split document):

| Folder | Member | Lessons covered |
|---|---|---|
| `Member-1/` | Member 1 | Lesson 1 (Intro to Testing & QA) + Lesson 2 (STLC & Test Management) |
| `Member-2/` | Member 2 | Lesson 3 (Types & Levels of Testing) + Lesson 7 (Performance/Security/Usability) |
| `Member-3/` | Member 3 | Lesson 4 (Black-Box & White-Box) + Lesson 5 (TDD & BDD) |
| `Member-4/` | Member 4 | Lesson 6 (Test Automation & CI/CD) + Lesson 8 (Defect Tracking & Bug Management) |
| `Member-5/` | Member 5 | Lesson 9 (Quality Metrics & Standards) + Lesson 10 (Case Study & Best Practices) |

## Real vs. ready-to-run — and why some things are one and not the other

This folder was built in a sandboxed environment with no internet access to download a
real MongoDB server binary and no running Docker daemon (`docker info` fails: no
`/var/run/docker.sock`), so a live Express server talking to a live database could not be
started here. Rather than fake screenshots of tool runs that never happened, every
document in this folder says plainly which of two things it is:

- **Real** — actually executed, with the unedited output kept as evidence: all 64 Vitest
  unit/security tests, all 5 Cucumber BDD scenarios, the ESLint complexity and code-quality
  scans, a real `autocannon` load test, and a real walkthrough of `bcryptjs`/`jsonwebtoken`
  behaviour (hashing, salting, signature verification, token expiry).
- **Ready-to-run** — written and checked for correctness against the real route/controller
  code, but needs a live server + real MongoDB to actually execute: the Postman/Newman API
  collection, the JMeter performance plan for DB-backed endpoints, and a full SonarQube
  scan. Each one's own README gives the exact 2-3 commands to run it for real on any
  group member's own machine (which already has what the main project's `backend/README.md`
  setup needs).

## A genuine finding, not a staged one

While designing the black-box test cases, a real gap was found in the actual code:
`respondToEnrollment()` never checks a class's `maxStudents` limit before approving one
more student. It's written up fully — reproduction steps, root cause (Five Whys), a
regression test, and a BDD scenario — in
`Member-4/Defects/Issue-1-Class-Capacity-Not-Enforced/`.

## Quick index

- Found a bug? → `Member-4/Defects/`
- Want the real numbers (coverage %, complexity, defect density)? →
  `Member-5/Quality-Metrics/`
- Want to run something yourself? → every folder's own `README.md` has exact commands.
- Want the big picture of what was tested and how? → `Member-1/Test-Plan/Test_Plan.md`
- Still need to add live-app screenshots (Postman run, manual UI walkthrough, etc.)? →
  **`EVIDENCE_CHECKLIST.md`** at the root of this folder — it lists exactly what's already
  real vs. what still needs a screenshot, with a `PUT_SCREENSHOTS_HERE.md` guide (file
  names + naming convention) inside each relevant `Evidence/Screenshots/` folder.
