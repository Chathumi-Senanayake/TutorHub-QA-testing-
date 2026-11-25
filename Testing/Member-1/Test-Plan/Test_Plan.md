# Test Plan — TutorHub (EC4206 Software Testing & QA Group Assignment)

## 1. Introduction

TutorHub is a MERN-stack (MongoDB, Express, React, Node) tuition-class management web app,
originally built solo for EC4307 (Web Application Development) and reused here for the
EC4206 QA group assignment, with a 5-member group each owning a different QA technique
from the module (see `Testing/README.md` for the full member-to-lesson mapping).

## 2. Scope

**In scope:** the real backend API (`backend/src/`) — authentication, class/enrollment
management, quizzes & auto-grading, attendance, payments — and a heuristic usability pass
over the real frontend pages.

**Out of scope for this pass:** `materialController.js`, `noticeController.js`,
`sessionController.js`, `statsController.js`, `studentController.js` (thinner CRUD-only
endpoints, deprioritised in favour of endpoints with real business logic — see
`Testing/Member-5/Quality-Metrics/Code_Coverage_Summary.md` for the honest reasoning), and
full browser-based end-to-end testing (needs a live server + MongoDB the testing
environment did not have — see `Test-Environment/Test_Environment.md`).

## 3. Features to be tested

| Feature | Owner (member) | Technique(s) applied |
|---|---|---|
| Register / Login / role-based access | Member 1, 2 | Unit tests, Security testing |
| STLC-driven planning of this whole effort | Member 1 | This document + `STLC/` |
| Levels/types of testing applied across the app | Member 2 | `Types-and-Levels/` |
| Performance under load, security, usability | Member 2 | `Performance/`, `Security/`, `Usability/` |
| Black-box design (EP/BVA/Decision Tables) | Member 3 | `Black-Box-Testing/` |
| White-box design (complexity, coverage) | Member 3 | `White-Box-Testing/` |
| TDD / BDD | Member 3 | `TDD/`, `BDD/` |
| API automation + CI/CD | Member 4 | `Automation/` |
| Defect tracking | Member 4 | `Defects/` |
| Quality metrics & ISO 25010 | Member 5 | `Quality-Metrics/` |
| Case study & best practices | Member 5 | `Case-Study/` |

## 4. Approach

A mix of **real, executed** tests (unit tests with mocked MongoDB models, BDD scenarios, a
real load test, real cryptographic security checks, real static analysis) and
**ready-to-run templates** for anything needing a live server + real MongoDB database,
which the testing environment used to build this folder could not provide. Every document
in this Testing/ folder says explicitly which category it falls into — see
`Testing/README.md` for why, and for exactly what to run on a real machine to fill the gap.

## 5. Entry / Exit criteria

- **Entry:** `backend/` dependencies installed (`npm install`); for the real, executed
  tests, no live server/database is required (everything mocks the data layer). For the
  ready-to-run items, a MongoDB connection and `npm run seed` first.
- **Exit:** all unit tests and BDD scenarios pass (`npm test`, `npm run test:bdd`); the
  known defect (`Member-4/Defects/Issue-1/`) is either fixed or explicitly accepted as a
  documented limitation before submission.

## 6. Resources & schedule

5 members, mapped 1:1 to the module's 10 lessons as already agreed in the group's main
task-split document (see the project's other Claude Doc / the EC4206 task list). This
Testing/ folder represents the group's test-design and test-execution phase; the
submission deadline and per-member schedule follow the task list already agreed.

## 7. Risks

| Risk | Mitigation |
|---|---|
| No shared MongoDB instance for integration/E2E testing before submission | Ready-to-run Postman/JMeter/Selenium-style templates, clear run instructions |
| Coverage is uneven across controllers (45.68% overall) | Documented honestly rather than inflated; prioritised the endpoints with real logic |
| One real defect found late in the process | Documented with a full RCA and a regression test rather than silently fixed or ignored |

## 8. Execution results (added 2026-11-25, all from real runs)

| Level / technique | Owner | Result |
|---|---|---|
| Unit + security (mocked DB) | M2/M3 | 64 / 64 pass |
| BDD | M3 | 5 / 5 scenarios pass |
| Black-box vs live API (EP, BVA, DT) | M3 | 55 / 63 pass; 4 defects |
| API automation (Newman) | M4 | 71 / 77 assertions pass; 6 failures = known defects |
| Manual UI test cases TC-09, TC-13, TC-21 | M1 | TC-09 pass; TC-13 and TC-21 partial (no UI for quiz edit / quiz attempt) |
| Security probes | M2 | 21 probes: 11 pass, 9 fail, 1 informational |
| Performance (autocannon, DB-backed routes) | M2 | Reads fine (95-266 req/s, 0 errors); login is a bottleneck (Issue-8) |
| Usability / responsive | M2 | Desktop fine; mobile overflow on teacher attendance |

Exit criteria (section 5) are **not met**: the known defect is not fixed, and 8+ further defects are open (`Member-4/Defects/Defect_Log.md`).
The scope exclusions in section 2 are partly obsolete: the live UI and the previously "out of scope" thin controllers
(materials, notices, sessions, stats, students) were exercised by Newman and the UI runs.
Risk table update: "No shared MongoDB instance" was mitigated by a local throw-away `mongod`.
