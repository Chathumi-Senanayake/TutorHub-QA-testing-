# Defect log (Lesson 8) — TutorHub

Life-cycle used: New -> Assigned -> In Progress -> Fixed -> Retest -> Closed / Reopened.
All defects below are **New / not fixed** as of 2026-11-25 (no shared tracker exists, so this file is the log).

| ID | Title | Severity | Found by | Detected in | Evidence | State |
|---|---|---|---|---|---|---|
| Issue-1 | Class capacity not enforced on approval | Medium | Member 3 design review | Unit test, BDD, black-box (EP-19, BVA-05), Newman, UI | `Issue-1-.../`, `Member-3/.../BB-UI-06a-e` | New |
| Issue-2 (DEF-BB-02) | Short password / malformed enrollment id **crashes the API** | **High** | Member 3 black-box run | EP-01, BVA-01, DT-X2, Newman | `Issue-2-.../`, `server-crash-log.txt` | New |
| Issue-3 (DEF-BB-03) | Malformed id -> HTTP 500 + stack trace leak | Low-Med | Member 3 | DT-X1, Newman, UI | `Issue-3-.../`, `BB-UI-13` | New |
| Issue-4 (DEF-BB-04) | Negative `maxStudents` / `monthlyFee` accepted | Low-Med | Member 3 | BVA-14/15, Newman | `Issue-4-.../` | New |
| Issue-5..9, GAP-1/2, OBS-02/03 | Mass assignment on quiz update, uploaded HTML served, no rate limit, login blocks server, missing headers, no quiz-attempt UI, no quiz-edit UI, mobile overflow | Medium .. Info | Members 1-2 | Security probes, autocannon, manual UI | `Additional-Defects-Security-Performance-UI.md` | New |
| OBS-01 | Teacher "Enrolled students" tile stale until reload | Low | Member 3 (UI) | `BB-UI-06c` | — | New |

**Defect counts (real runs):** 4 defects across 63 black-box cases and 50 Newman requests. The Newman suite
reproduces all 4 automatically; its defect folders stay red until the fixes land.

**Update:** Members 1 and 2 added 9 more items (see `Additional-Defects-Security-Performance-UI.md`); Issue-2 also covers NoSQL-operator payloads.
