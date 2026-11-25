# Black-Box Test Execution Report — Member 3

**Technique:** Equivalence Partitioning, Boundary Value Analysis, Decision Tables (designs in `../Equivalence-Partitioning`, `../Boundary-Value-Analysis`, `../Decision-Table`).
**Executed:** 2026-11-25 against the live app (Express API on :5000, real MongoDB 8.3 on a throwaway database, React UI on :5173, Microsoft Edge). Nothing was mocked.

## Result: 63 cases — 55 passed, 8 failed (4 distinct defects)

| Defect | Severity | Cases | What happened |
|---|---|---|---|
| DEF-BB-01 (= Issue-1) | Medium | EP-19, BVA-05 | Capacity not enforced: 15-seat class holds 16 approved; 1-seat class holds 2 (UI: BB-UI-06a–e) |
| **DEF-BB-02 (new)** | **High** | EP-01, BVA-01, DT-X2 | Password < 6 chars (or malformed enrollment id) **kills the API process**; the design sheet expected a clean validation error (`Evidence/server-crash-log.txt`) |
| DEF-BB-03 (new) | Low-Med | DT-X1 | Malformed id → HTTP 500 with raw Mongoose text + stack trace with server paths (BB-UI-13) |
| DEF-BB-04 (new) | Low-Med | BVA-14, BVA-15 | Negative `maxStudents` / `monthlyFee` accepted |

Observation OBS-01: the teacher "Enrolled students" tile is stale until reload (BB-UI-06c).

## Evidence (all real output)

| What | File |
|---|---|
| Per-case results with expected vs actual | `Black_Box_Execution_Results.xlsx`, `execution-results.json` |
| Every HTTP request/response | `http-transcript.json` |
| Raw console output of the run | `console-output.txt` |
| Real server crash log | `Evidence/server-crash-log.txt` |
| 21 real browser screenshots of the running app | `Evidence/Screenshots/BB-UI-*.png` (index: `screenshot-index.txt`) |

## Notes
- `BB-UI-10` shows 26 attendance records because test BB-UI-07 marked one extra "late" before it (24/26 = 92%).
- The UI blocks passwords under 6 chars (HTML `minLength`), so DEF-BB-02 is only reachable by direct API calls — which is exactly what a black-box API test does.
- Cases marked `[exploratory]` were added beyond the original design sheets.

## Reproduce
```powershell
# MongoDB running; backend/.env set; then:
cd backend; npm run seed; npm start        # terminal 1
cd frontend; npm run dev                   # terminal 2
cd backend; node ../Testing/Member-3/Black-Box-Testing/Execution/run-blackbox.mjs
# screenshots: PW_DIR=<folder with playwright-core> node ../Testing/Member-3/Black-Box-Testing/Execution/capture-ui-evidence.mjs
```
