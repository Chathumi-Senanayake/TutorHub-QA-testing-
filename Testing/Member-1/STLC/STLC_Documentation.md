# STLC (Software Testing Life Cycle) — applied to TutorHub (Lesson 2) — Member 1

| Phase | What it means | What the group actually did for TutorHub |
|---|---|---|
| 1. Requirement Analysis | Read the requirements, find out what needs testing | Read every controller/model in `backend/src/` to find the real validation and business rules worth testing (documented per-field in `Member-3/Black-Box-Testing/Equivalence-Partitioning/`) |
| 2. Test Planning | Decide scope, tools, who does what | `Member-1/Test-Plan/Test_Plan.md` + the 5-member split (this whole `Testing/` folder's structure) |
| 3. Test Case Development | Write the actual test cases | `Member-1/Test-Cases/TutorHub_Test_Cases.xlsx` (master list) + the detailed EP/BVA/Decision Table sheets in `Member-3/Black-Box-Testing/` |
| 4. Test Environment Setup | Get a working copy ready to test on | `Member-1/Test-Environment/Test_Environment.md` — local MongoDB 8.3, API, React UI, Edge; seeded data (done for real on 2026-11-25) |
| 5. Test Execution | Run the test cases, record pass/fail | Unit 64/64, BDD 5/5, black-box 55/63, Newman 71/77 assertions, security 11/21, manual UI TC-09/13/21, load tests (all real, logged output in each member's folder) |
| 6. Test Cycle Closure | Summarise results, lessons learned, sign off | This document + `Member-5/Quality-Metrics/Test_Execution_Metrics.md`. **No sign-off:** 4+ defects open, one High (server crash) |

## Lessons learned (closure notes)

- Testing the *data validation and business-rule* layer (controllers) with mocked models
  gave real, fast, repeatable results without needing a shared database — a good default
  approach for a student group without a shared always-on server.
- Reading the actual code before writing test cases (rather than testing blind from the UI)
  is what surfaced the one real defect (`Member-4/Defects/Issue-1/`) — black-box thinking
  alone (testing only through the UI) would likely have missed it, since the UI itself
  doesn't show a seat-limit warning either.
- A full STLC cycle for a group project of this size doesn't need a dedicated test
  management tool (Jira/TestRail) — a shared folder structure with clear ownership per
  member, as used here, is proportionate to the scale.

## Closure update (2026-11-25) — what changed our earlier conclusions

- The first closure note said mocked unit tests were "a good default". Live execution showed their limit: 64/64 passing unit tests
  coexisted with a defect that crashes the server (Issue-2), because the mocks never ran the real validators or Express error path.
- Reading the code found Issue-1; **running the system** found Issue-2..9. Both are needed.
- Planned vs actual: three test cases (TC-09, TC-13, TC-21) were "Ready-to-run" on paper; executing them showed TC-13 and TC-21
  cannot be completed in the UI because the quiz edit / quiz attempt screens do not exist (GAP-1, GAP-2).
- The written test documents themselves contained wrong statements that execution corrected (e.g. the usability report said the
  Requests tab has no pending badge; the BVA sheet expected a clean validation error for a short password).
