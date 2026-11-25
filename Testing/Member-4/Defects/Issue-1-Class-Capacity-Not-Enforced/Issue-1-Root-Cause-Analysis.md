# Issue 1: Class seat capacity is not enforced when approving enrollments

**Found by:** reading `backend/src/controllers/classGroupController.js` while writing the
black-box test design (Equivalence Partitioning / Boundary Value Analysis, see
`Testing/Member-3/Black-Box-Testing/`), then confirmed with an automated regression test
and a BDD scenario (both listed below). This is a real gap in the current code, not a
hypothetical example.

## Bug life-cycle state

| State | Status |
|---|---|
| New | reported here, 2026-11-25 |
| Assigned | Member 4 (Defect Tracking & Bug Management, Lesson 8) |
| In Progress | not yet fixed in `backend/src/controllers/classGroupController.js` |
| Fixed | — |
| Retest | — |
| Closed / Reopened | — |

*(Jira/Bugzilla would track these same states for a real team; this project tracks them in
this file since the group has no shared issue tracker.)*

## Summary

`ClassGroup.maxStudents` exists on the model and is shown in the teacher's UI as a seat
limit, but `respondToEnrollment()` (the endpoint a teacher calls to approve a pending
enrollment request) never checks how many students are already approved before approving
one more. A class with `maxStudents: 15` can end up with 16, 20, or any number of approved
students, because nothing in the approval path counts the existing approved enrollments.

## Steps to reproduce

1. Create a class with `maxStudents: 2` and publish it.
2. Have 2 different students request a seat; approve both (`PATCH
   /api/classes/:id/enrollments/:enrollmentId` with `{ "status": "approved" }`).
3. Have a 3rd student request a seat, then approve that request too.
4. **Expected:** step 3 is refused (class is full).
5. **Actual:** step 3 succeeds with `200` and `status: "approved"` — the class now has 3
   approved students against a `maxStudents` of 2.

## Root Cause Analysis — Five Whys

1. **Why did a 3rd student get approved into a 2-seat class?**
   Because `respondToEnrollment()` sets `status: "approved"` unconditionally whenever the
   request body's status is valid — it never looks at `maxStudents` at all.
2. **Why doesn't it look at `maxStudents`?**
   Because the function was written to validate *only* the shape of the request (is
   `status` one of `approved`/`rejected`) and whether the enrollment record exists — not
   the business rule about seat limits.
3. **Why wasn't the seat-limit rule included when this endpoint was written?**
   Because `maxStudents` was added to the `ClassGroup` model for *display* purposes (the
   "X / 15 seats" UI on the teacher dashboard) before the approval flow was built, and the
   two were never explicitly linked back together.
4. **Why didn't testing catch this gap before now?**
   Because there was no black-box test design for `respondToEnrollment()` until this QA
   module's Equivalence Partitioning / Boundary Value Analysis pass (Lesson 4) — manual
   click-through testing of the happy path (one approval) never exercises the
   "class already full" boundary.
5. **Why is this the root cause (not a deeper one)?**
   Because the fix is local and well-understood: count approved enrollments for the class
   and compare against `maxStudents` before writing `status: "approved"`. No architectural
   change is needed — this is a missing validation check, not a design flaw.

**Root cause:** a missing business-rule check in `respondToEnrollment()` — it validates
the *shape* of the request but not the *capacity constraint* that `maxStudents` is
supposed to enforce.

## Suggested fix

```js
// inside respondToEnrollment, before the findOneAndUpdate call:
if (status === 'approved') {
  const approvedCount = await Enrollment.countDocuments({
    classGroup: req.targetClass._id,
    status: 'approved',
  });
  if (approvedCount >= req.targetClass.maxStudents) {
    return res.status(409).json({ message: 'This class is already full' });
  }
}
```

## Severity / priority

- **Severity:** Medium — does not crash the app or expose data, but silently breaks a
  stated business rule (class size limits), which affects a teacher's ability to manage
  class size and could affect fee/session planning.
- **Priority:** Should be fixed before the next release; not a blocker for the current
  EC4206/EC4307 submission since it does not affect the rubric's CRUD/validation marks
  directly, but it is worth mentioning in the project report's "known issues" section.

## Evidence this gap is real (not just a design opinion)

- **Regression test** pinning down today's (buggy) behaviour:
  `backend/tests/unit/classGroupController.test.js` → test
  `"BUG: currently approves a request even when the class is already at maxStudents (no capacity check)"`.
  Once the fix above lands, that test should be updated to expect a `409` instead.
- **BDD scenario** telling the same story in Gherkin:
  `backend/tests/bdd/features/class_capacity.feature` (tagged `@knownissue`), with its
  step definitions in `backend/tests/bdd/step-definitions/class_capacity.steps.js` —
  both run as part of the real Cucumber suite (see `Testing/Member-3/BDD/`).
- **Black-box design rows** calling out the missing boundary:
  `Testing/Member-3/Black-Box-Testing/Equivalence-Partitioning/Equivalence_Partitioning.xlsx`
  (row "Class seats (maxStudents)") and
  `Testing/Member-3/Black-Box-Testing/Boundary-Value-Analysis/Boundary_Value_Analysis.xlsx`
  (row "15 approved, 1 pending -> approve").

## Retesting plan (once fixed)

1. Re-run `npm test` in `backend/` — the regression test above should fail until its
   expectation is updated to `409`, which is the signal the fix landed.
2. Re-run `npx cucumber-js` — the `@knownissue` scenario's final step text should change
   from "today the request is still approved" to the new, correct behaviour, and the
   feature file's `@knownissue` tag should be removed.
3. Manually retest in the running app: fill a class to `maxStudents`, then try to approve
   one more pending request from the teacher dashboard; confirm the UI shows a clear
   "class is full" message instead of silently succeeding.
