# Test Environment (Lesson 2) — Member 1

Updated 2026-11-25. The first version of this file was written in a sandbox with no database; the
full tests below were then run on a real Windows machine, so this is the environment that produced the
live results in `Member-3/.../Execution`, `Member-4/Automation/API/reports` and `Member-2/*`.

| Component | Detail |
|---|---|
| OS | Windows 11 Pro (10.0.26200) |
| Node.js / npm | v24.15.0 / 11.12.1 |
| Database | MongoDB Server 8.3 (local `mongod`, throw-away data folder, port 27117, DB `tutorhub_qa`; the developer's own database was not touched) |
| Backend | Express 4 + Mongoose 8, started with `node src/server.js`, port 5000, env vars supplied on the command line (no `.env` file created) |
| Frontend | React 19 + Vite dev server, `127.0.0.1:5173` |
| Browser | Microsoft Edge (headless, driven by `playwright-core`) for screenshots; 1366x850 desktop and 375x812 mobile emulation |
| API automation | Newman + `newman-reporter-htmlextra` |
| Load testing | autocannon 9 (JMeter is **not** installed, so the `.jmx` plan was not run) |
| Unit / BDD | Vitest 5 (64 tests), Cucumber.js 13 (5 scenarios) |
| Static analysis | ESLint 9 (backend), oxlint (frontend) |
| Not available | SonarQube (needs Docker; Docker daemon not running); GitHub Actions (project is not a git repo / not pushed); Postman desktop GUI |

## Test data
`npm run seed` creates 2 teachers, 3 classes, 7 students, enrollments in all three states, sessions, attendance, quizzes and
payments (logins are in the main `README.md`). Several scripts re-seed before running, so results are repeatable.
Tests that create their own users use e-mails ending `@qa.tutorhub.test` with a per-run suffix.

## Reproduce
```powershell
# MongoDB running, then in backend/ (PowerShell):
$env:MONGO_URI='mongodb://127.0.0.1:27017/tutorhub'; $env:JWT_SECRET='test-secret'; $env:CLIENT_URL='http://127.0.0.1:5173'
npm run seed; npm start          # terminal 1
cd ..\frontend; npx vite --host 127.0.0.1   # terminal 2
```
Then the commands listed in each member's README (`run-blackbox.mjs`, `run-newman.js`, `security-probes.mjs`,
`capture-manual-tests.mjs`).
