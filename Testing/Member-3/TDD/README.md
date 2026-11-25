# TDD (Lesson 5) — Member 3

A real Red → Green → Refactor cycle, done on the actual TutorHub codebase, not a toy
example.

**The feature:** the attendance-percentage math inside `attendanceController.getMyAttendance()`
was inline logic with no test of its own. It was pulled out into its own function
(`calculateAttendancePercentage`) test-first.

1. **Red** — `tests/attendanceStats.test.js` (same file as
   `backend/tests/unit/attendanceStats.test.js`) was written and run *before*
   `src/utils/attendanceStats.js` existed. Real failure: `Evidence/TDD_Red_Test_Failure.png`
   / `Evidence/red-output.txt` — `Cannot find module '../../src/utils/attendanceStats.js'`.
2. **Green** — `attendanceStats.implementation.js` (same file as
   `backend/src/utils/attendanceStats.js`) was then written to make the 3 tests pass. Real
   pass: `Evidence/TDD_Green_Test_Pass.png` / `Evidence/green-output.txt` — 3 passed, 0
   failed.
3. **Refactor** — `attendanceController.getMyAttendance()` was then changed to call the new
   function instead of repeating the same 5 lines inline. The full suite was re-run
   afterwards (`npm test` → 64/64 passed, see
   `Testing/Member-5/Quality-Metrics/Code_Coverage_Summary.md`) to confirm the refactor
   didn't break anything already covered.

## Why this one function

It's small enough to show the whole cycle clearly, it's real production logic (not a
contrived example), and it already had 3 known edge cases worth testing on their own
(zero records, exact rounding, "late" counted differently from "present") — exactly the
kind of pure, no-database logic TDD works best on.
