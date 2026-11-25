# Statement & Branch Coverage (Lesson 4) — Member 3

`html-report/index.html` is the real, unedited Istanbul/v8 coverage report produced by:

```bash
cd backend && npx vitest run --coverage
```

Open `html-report/index.html` in a browser to click into any file and see exactly which
lines/branches the 64 real tests in `backend/tests/unit/` do and don't reach (green =
covered, red = not covered).

## Headline numbers (real, from the same run)

| Scope | Statements | Branches |
|---|---|---|
| `controllers/attemptController.js` (quiz grading — full CRUD entity) | 100% | 100% |
| `middleware/auth.js` (token verification) | 100% | 100% |
| `controllers/authController.js` | 96.15% | 96.15% |
| `middleware/classAccess.js` (authorization) | 89.65% | 100% |
| `controllers/attendanceController.js` | 75% | 81.81% |
| `controllers/paymentController.js` | 79.16% | 75% |
| Whole backend (`controllers/` + `middleware/` + `utils/`) | 45.68% | 44.9% |

The whole-backend number is lower because several controllers (`materialController.js`,
`noticeController.js`, `sessionController.js`, `statsController.js`, `studentController.js`)
have no unit tests yet — they're simpler CRUD-over-one-model endpoints with less business
logic worth white-box testing, and were deprioritised in favour of the endpoints with real
validation/authorization/scoring logic. See
`Testing/Member-5/Quality-Metrics/Code_Coverage_Summary.md` for the full per-file table and
what a reasonable next-coverage target would be.
