# ISO/IEC 25010 Mapping (Lesson 9) — Member 5

How TutorHub maps onto the 8 Product Quality characteristics, with real evidence from this
Testing/ folder for each — not a generic restatement of the standard.

| Characteristic | TutorHub evidence |
|---|---|
| **Functional Suitability** | Quiz grading at 100% coverage and all 5 BDD scenarios pass; live black-box run confirmed enrollment, attendance %, payment and quiz rules (55 of 63 cases pass). **Gap:** seat capacity is not enforced (Issue-1: 16 approved in a 15-seat class) — *functional correctness* is only partly met |
| **Performance Efficiency** | Real load test: 8,012 req/sec average, 5.76ms average latency, 0 errors at 50 concurrent connections (`Member-2/Performance/`) |
| **Compatibility** | Not separately tested — the frontend is a standard React SPA talking to a REST API over JSON, so no custom integration protocol to verify; worth a line in the report rather than a dedicated test |
| **Usability** | Heuristic review against Nielsen's 10 heuristics, grounded in the real page components (`Member-2/Usability/`) |
| **Reliability** | **Not met for fault tolerance.** One request with a 3-character password (or a malformed enrollment id) makes the Node process exit (Issue-2, High) — observed 3 times in one run (`Member-3/.../Evidence/server-crash-log.txt`). *Maturity/recoverability*: duplicate-state guards work (already-attempted 409, re-request after rejection); no automatic restart or process manager exists. MTTF/MTTR not measurable without production use |
| **Security** | Passing: bcrypt hashing, JWT verification, role checks, ownership checks, quiz answer key hidden from students, password never returned (live cases DT-A1..A12 all pass). **Failing:** Issue-2 lets any anonymous client stop the service (availability); Issue-3 returns stack traces with server file paths unless `NODE_ENV=production` (confidentiality) |
| **Maintainability** | Cyclomatic complexity: every function Low risk (M ≤ 10, average ≈3.7); 3 ESLint warnings total across the whole backend (`Member-3/White-Box-Testing/`, `ESLint_Code_Quality_Report.md` in this folder) |
| **Portability** | Standard Node.js/Express + MongoDB stack with no OS-specific code; `.env`-based configuration means it runs the same on any machine with Node 22 + MongoDB |

## Quality-in-Use (the 5 user-facing characteristics)

| Characteristic | Evidence |
|---|---|
| Effectiveness | Demo video script (`TutorHub_Demo_Video_Script.docx`, delivered earlier) shows a teacher and a student completing their real goals end-to-end |
| Efficiency | `ClassCard` shows fee/schedule/subjects together so a student compares classes without opening each one (`Member-2/Usability/`) |
| Satisfaction | Not measured — would need real user feedback (a short survey of actual tuition students/teachers), listed as future work |
| Freedom from risk | Four defects are logged (`Member-4/Defects/Defect_Log.md`): the service can be crashed by one request (economic/operational risk) and class sizes can be exceeded — documented rather than hidden, none fixed yet |
| Context coverage | Responsive Tailwind layout (not separately tested here — a manual phone-width check is a quick, worthwhile addition before the final report) |
