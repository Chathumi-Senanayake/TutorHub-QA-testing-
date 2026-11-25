# Types and Levels of Testing (Lesson 3) — Member 2

Which level/type of testing was actually performed on each real TutorHub feature, and
where the evidence for it lives in this Testing/ folder.

| Feature | Unit | Integration | System | Acceptance | Functional | Non-functional |
|---|---|---|---|---|---|---|
| Auth (register/login) | `tests/unit/authController.test.js` | — (needs real DB, see Automation/API) | — | — | yes | Security: `Member-2/Security/` |
| Role/token access control | `tests/unit/authMiddleware.test.js`, `tests/unit/classAccess.test.js` | — | — | — | yes | Security: `Member-2/Security/` |
| Quiz auto-grading | `tests/unit/attemptController.test.js` (100% coverage) + BDD `quiz_grading.feature` | — | — | Demo video walkthrough (create/edit/delete a quiz, attempt it) | yes | — |
| Attendance marking + % | `tests/unit/attendanceController.test.js` | — | — | Demo video walkthrough | yes | — |
| Enrollment request/approve | `tests/unit/classGroupController.test.js` + BDD `class_capacity.feature` | — | — | Demo video walkthrough | yes (and the found gap: `Member-4/Defects/Issue-1`) | — |
| Payments (due/paid) | `tests/unit/paymentController.test.js` | — | — | Demo video walkthrough | yes | — |
| Whole signup → browse → join → attempt quiz → check progress flow | — | Postman collection folders chained together (`Member-4/Automation/API/`) | ready-to-run, needs live server+DB | — | yes | — |
| Concurrent quiz submission / login | — | — | `Member-2/Performance/` (real health-endpoint run + ready `.jmx` for the DB-backed endpoints) | — | — | Performance |
| "Is this actually easy to use for a non-technical tuition teacher?" | — | — | — | `Member-2/Usability/` | — | Usability |

**Static vs dynamic:** everything in the "Unit" column above is dynamic testing (the code
actually runs). The ESLint complexity + quality scans in
`Testing/Member-3/White-Box-Testing/` and `Testing/Member-5/Quality-Metrics/` are **static**
testing — they read the source without executing it.

**Why "Integration" and "System" are mostly "ready-to-run" here:** both need the real
Express server talking to a real MongoDB database running at the same time, which this
sandbox could not provide (see `Testing/README.md`). Every "Unit" entry above, by
contrast, mocks the database and so could be (and was) actually run.
