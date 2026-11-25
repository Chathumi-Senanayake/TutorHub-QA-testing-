# Usability Testing (Lesson 7) — Member 2

A heuristic review of the real TutorHub frontend (`frontend/src/pages/`), using Jakob
Nielsen's 10 usability heuristics as the checklist. This was read directly from the actual
page components (`admin/ClassDetail.jsx`, `admin/MyClasses.jsx`,
`student/BrowseClasses.jsx`, `student/ClassDetail.jsx`, `student/MyClasses.jsx`,
`public/Login.jsx`, `public/Landing.jsx`), not a generic checklist — every example below
names the real component or tab it came from.

| # | Heuristic | What TutorHub does well | What's worth improving |
|---|---|---|---|
| 1 | Visibility of system status | `AttendanceRing` and `ProgressChart` give an immediate visual read of where a student stands, instead of a raw number buried in a table | The teacher's "Requests" tab (`admin/ClassDetail.jsx`) has no badge/count on the tab label itself showing how many requests are pending — a teacher has to click in to find out |
| 2 | Match between system and the real world | Tab labels are plain words a tuition teacher already knows: "Requests", "Attendance", "Quizzes", "Materials" — no jargon | — |
| 3 | User control and freedom | A rejected enrollment can be re-requested (`requestEnrollment` resets a rejected record back to pending) — students aren't permanently locked out by a mistake | There's no "undo" on marking attendance — a teacher who mis-clicks "absent" must find the same student again and correct it manually |
| 4 | Consistency and standards | Every list-style tab (Requests, Materials, Notices) uses the same card layout and the same `PhotoPlaceholder`/`Badge` components, so switching tabs doesn't require re-learning the UI | — |
| 5 | Error prevention | Quiz question inputs use `placeholder="Question 1"` / `"Option 1"` style hints so a teacher can't submit a blank-looking question by accident; `required` is set on the quiz title and notice title/body fields | The monthly-fee and max-students number inputs have no visible min/max guidance in the UI itself (the backend defaults them sensibly, but a teacher typing "0" or a huge number gets no warning before saving) |
| 6 | Recognition rather than recall | `ClassCard` shows fee, schedule and subjects together on the card itself, so a student browsing `BrowseClasses` doesn't have to open each class to compare them | — |
| 7 | Flexibility and efficiency of use | `ThemeToggle` (dark mode) is a one-click, persistent preference rather than buried in a settings page | — |

(Heuristics 8-10 — aesthetic/minimalist design, helping users recognise and recover from
errors, and help/documentation — were left out of this pass; they're a reasonable next
step once the group has real user feedback to review, rather than another round of the
same reading-the-code exercise.)

## Recommended fixes worth putting in the report

1. Add a pending-request count badge to the "Requests" tab label.
2. Add a confirm-and-undo (or a quick re-edit) affordance to `markAttendance` in the UI,
   mirroring how `requestEnrollment` already lets a rejected request be retried.
3. Show the `monthlyFee`/`maxStudents` defaults as placeholder text in the class-creation
   form, so a teacher sees the sensible default instead of an empty box.
