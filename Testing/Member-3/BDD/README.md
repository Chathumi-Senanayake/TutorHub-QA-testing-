# BDD (Lesson 5) — Member 3

**Status: real, executed.** Both feature files here actually run against the real
`submitAttempt()` and `respondToEnrollment()` functions in
`backend/src/controllers/` — not against a toy re-implementation — using `esmock` to swap
out their Mongoose model imports for in-memory fakes (same spirit as the mocked unit
tests, since no real MongoDB was available — see `Testing/README.md`).

```bash
cd backend && npx cucumber-js
```

**Real result:** 5 scenarios, 18 steps, all passed. `reports/cucumber-report.html` is the
real, unedited report from that run (open it in a browser); `reports/cucumber-report.json`
is the machine-readable version, e.g. for a CI badge.

## The two features

- `quiz_grading.feature` — the quiz auto-grading scenarios from Lesson 5's TDD/BDD pairing:
  full marks, half marks, a duplicate attempt (409), and the zero-question boundary case.
- `class_capacity.feature` (tagged `@knownissue`) — tells the story of the real defect in
  `Testing/Member-4/Defects/Issue-1-Class-Capacity-Not-Enforced/` in Gherkin: a teacher
  approving a student into an already-full class. Its final step name
  ("today the request is still approved, because no capacity check exists yet") is
  deliberately worded to describe *today's* behaviour, not the *correct* behaviour — that
  wording should change, and the `@knownissue` tag should be removed, once the fix lands.
