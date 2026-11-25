# API Automation (Postman / Newman) — Member 4, Lesson 6

**Status: EXECUTED for real on 2026-11-25** against the live Express API + a real MongoDB 8.3.
Result: **50 requests, 77 assertions — 71 passed, 6 failed.** The 6 failures are exactly the known
defects (Issue-1 capacity, Issue-2 crash, Issue-3 malformed id/500, Issue-4 negative values),
which live in the last folders on purpose and stay red until fixed (see `../../Defects/Defect_Log.md`).

Real evidence: `reports/newman-console-output.txt`, `reports/api-report.html` (+ `newman-junit.xml`,
`newman-run.json`), screenshots of that HTML report in `Evidence/Screenshots/NEWMAN01…/NEWMAN02…`.
No Postman-desktop screenshots exist (Postman GUI was not used); Newman is the same engine.


## Files

- `TutorHub_API_Tests.postman_collection.json` — 50 requests across 12 folders (Health,
  Auth, Classes, Enrollment, Quizzes, Attempts, Attendance, Payments, Sessions/Materials/
  Notices/Stats), including the negative-path requests (missing fields, wrong role, invalid
  status) that the rubric's "Validation" criterion looks for.
- `TutorHub_Local.postman_environment.json` — the variables the collection expects
  (`baseUrl`, `teacherToken`, `studentToken`, `classId`, `enrollmentId`, `quizId`,
  `sessionId`).
- `run-newman.js` — runs the whole collection from the command line and writes an HTML +
  JUnit report, the same shape `Testing/Member-4/Automation/CI-CD` expects for CI.

## How to run it

```bash
cd backend && npm run seed && npm start          # MongoDB running
cd Testing/Member-4/Automation/API
npm install newman newman-reporter-htmlextra
node run-newman.js                               # exit code 1 while the known defects remain
```
Postman GUI: import the collection + environment and use the Collection Runner (scripts capture tokens/ids).

## A request worth reading closely

The **Enrollment** folder's last request is named
`[Defect Issue-1] Approve beyond maxStudents — SHOULD be 409, currently 200`. It is there on
purpose: it documents the real gap written up in
`Testing/Member-4/Defects/Issue-1-Class-Capacity-Not-Enforced/`. Running it against a class
already at capacity is expected to currently succeed (200) instead of being refused (409) —
that mismatch *is* the finding, not a mistake in the collection.
