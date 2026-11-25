# Code Coverage Summary (Lesson 9) — Member 5

Real, unedited output of `cd backend && npx vitest run --coverage` (64 tests, all passing)
and `npx cucumber-js` (5 scenarios, 18 steps, all passing) — see `html-report/` in
`Testing/Member-3/White-Box-Testing/Statement-Branch-Coverage/` for the clickable report
this table was read from.

| File | Statements % | Branches % | Functions % | Lines % |
|---|---|---|---|---|
| controllers/attemptController.js (quiz grading — the "full CRUD" entity) | 100 | 100 | 100 | 100 |
| middleware/auth.js (token verification) | 100 | 100 | 100 | 100 |
| utils/attendanceStats.js (the TDD-built function) | 100 | 100 | 100 | 100 |
| controllers/authController.js | 96.15 | 96.15 | 75 | 96.15 |
| middleware/classAccess.js (authorization) | 89.65 | 100 | 100 | 89.28 |
| controllers/paymentController.js | 79.16 | 75 | 50 | 77.27 |
| controllers/attendanceController.js | 75 | 81.81 | 75 | 76.47 |
| controllers/classGroupController.js | 32.83 | 27.27 | 11.11 | 35 |
| controllers/materialController.js | 0 | 0 | 0 | 0 |
| controllers/noticeController.js | 0 | 0 | 0 | 0 |
| controllers/quizController.js | 0 | 0 | 0 | 0 |
| controllers/sessionController.js | 0 | 0 | 0 | 0 |
| controllers/statsController.js | 0 | 0 | 0 | 0 |
| controllers/studentController.js | 0 | 0 | 0 | 0 |
| middleware/errorHandler.js | 0 | 0 | 0 | 0 |
| middleware/upload.js | 0 | 0 | 0 | 0 |
| utils/generateToken.js | 0 | 0 | 0 | 0 |
| **TOTAL (controllers + middleware + utils)** | **45.68%** | **44.9%** | **32.14%** | **46.66%** |

## Reading this honestly

The group deliberately tested depth-first, not breadth-first: every controller that has
*real business logic worth testing* (validation rules, scoring math, authorization,
percentage calculations) is at 75%+ coverage, several at 100%. The 0%-covered files are
either thin CRUD wrappers with little logic of their own (`materialController.js`,
`noticeController.js`, `sessionController.js`, `studentController.js`,
`statsController.js`) or infrastructure that is hard to unit-test meaningfully
(`errorHandler.js`, `upload.js`, `generateToken.js` — the last one is mocked out
everywhere it's used, which is why it shows 0% even though it's exercised indirectly).
**45.68% overall is an honest number for the time available, not a target the group
pretended to hit 80%+ on.** A realistic next step, if time allows, is unit tests for
`quizController.js` (CRUD + the student-vs-teacher answer-stripping logic) and
`sessionController.js`.

## Defect Density

```
Defect Density = Defects Found / Size of Code (KLOC)
```

- Backend source size: **1,620 lines** (`find backend/src -name "*.js" | xargs wc -l`) = **1.62 KLOC**.
- Defects found by this QA pass (updated 2026-11-25 after live black-box + Newman runs): **4**
  (`Testing/Member-4/Defects/Defect_Log.md`: Issue-1 capacity, Issue-2 crash, Issue-3 malformed id/500,
  Issue-4 negative values).
- **Defect Density = 4 / 1.62 = 2.47 defects per KLOC** (the earlier figure, 0.62, counted only Issue-1
  because the app had never been run live).

Read it as "found so far by the testing in this folder". Statement coverage is still 45.68%, so about half
the backend has not been unit-tested; and the live runs showed that high coverage does not guarantee freedom
from defects (see `Test_Execution_Metrics.md`, section 4). Full execution metrics are in that file.

## MTTF / MTTR / MTBF

Not applicable yet in a meaningful way — these are measured from a system running in
production over time (how often it actually fails for real users), and TutorHub is a
university mini-project that hasn't been deployed to real users yet. They're listed here,
with that context, rather than invented numbers: **Mean Time To Failure/Repair/Between
Failures should be tracked once Section EC4307's deployed version has real usage data**
(e.g. if/when it's hosted for the group's own tuition-class use).
