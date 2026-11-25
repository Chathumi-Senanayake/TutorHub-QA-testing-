# Evidence checklist — what's already real vs. what the group still needs to capture

This folder was built in a sandbox with no live MongoDB and no running Docker daemon (see
`Testing/README.md` and `Member-1/Test-Environment/Test_Environment.md` for the exact
reason). So some evidence is already real, and some genuinely needs one of you to run the
actual app on your own laptop and take screenshots. This file is the single checklist for
that second part.

## Already real — nothing to do

These are genuine, unedited outputs already sitting in the folders below. Don't re-do these.

| Evidence | Where |
|---|---|
| 64 passing unit tests (mocked DB) | `Member-3/White-Box-Testing/`, terminal output quoted in `Member-5/Quality-Metrics/Code_Coverage_Summary.md` |
| HTML code coverage report | `Member-3/White-Box-Testing/Statement-Branch-Coverage/html-report/index.html` — open directly in a browser |
| TDD red→green screenshots/log | `Member-3/TDD/Evidence/` |
| 5 passing BDD scenarios (Cucumber) | `Member-3/BDD/reports/cucumber-report.html` |
| ESLint complexity + code-quality scan output | `Member-5/Quality-Metrics/ESLint_Code_Quality_Report.md` |
| Real load test (autocannon) against `/api/health` | `Member-2/Performance/autocannon-health-results.json` |
| Real bcrypt/JWT security walkthrough | `Member-2/Security/Security_Testing_Report.md` |
| The one genuine defect found + RCA | `Member-4/Defects/Issue-1-Class-Capacity-Not-Enforced/` |

## Still needed — capture these on a real machine (any teammate's laptop is enough)

Each row links to the `Evidence/Screenshots/PUT_SCREENSHOTS_HERE.md` guide in that folder,
which has the exact file names, what to click through, and the naming convention.

| # | Owner | Folder | What |
|---|---|---|---|
| 1 | Member 1 | `Member-1/Test-Cases/Evidence/Screenshots/` | Manual UI walkthrough for TC-09, TC-13, TC-21 (create class, quiz CRUD, full signup→quiz→progress flow) |
| 2 | Member 2 | `Member-2/Security/Evidence/Screenshots/` | *(optional)* NoSQL-injection attempt, blocked-without-token, cross-student-access-blocked |
| 3 | Member 2 | `Member-2/Performance/Evidence/Screenshots/` | *(optional)* Real JMeter run against DB-backed routes |
| 4 | Member 4 | `Member-4/Automation/API/Evidence/Screenshots/` | **Most important one** — real Postman collection run + Newman terminal output |
| 5 | Member 5 | `Member-5/Quality-Metrics/Evidence/Screenshots/` | Coverage terminal/HTML screenshot (quick, no DB needed) + *(optional)* real SonarQube dashboard |

Rows 1, 4 and 5's coverage screenshot are the ones worth prioritising before submission —
they're quick and directly back up test cases that are currently just "Ready-to-run" on
paper. Rows 2, 3 and 5's SonarQube screenshot are optional extra depth if there's time.

## One-time setup needed before any of the above

1. Any teammate's laptop with Node.js 18+ and MongoDB (local or a free MongoDB Atlas
   cluster) — see the main project's `backend/README.md`.
2. `cd backend && npm install && npm run seed` once, to get demo accounts + a sample class.
3. `npm run dev` in `backend/` and `npm run dev` in `frontend/` to get the real app running
   in a browser.
