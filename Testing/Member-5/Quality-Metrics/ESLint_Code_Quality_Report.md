# Code Quality Scan — SonarQube stand-in (Lesson 9) — Member 5

**Status: real scan, substitute tool.** A real SonarQube analysis needs a running SonarQube
server (Docker or a local Java install of the server itself) and, for the full
"Clean as You Code" workflow, a SonarCloud/GitHub integration. The sandbox that built this
Testing/ folder has no Docker daemon available, so a full SonarQube run could not happen
here (see `Testing/README.md`). What follows is a real static-analysis scan with ESLint's
recommended rule set over the entire backend — the same *kind* of signal (code smells,
unused code, likely bugs) SonarQube's "Maintainability"/"Reliability" ratings are built
from, just from a lighter tool.

```bash
cd backend && npx eslint -c eslint.quality.config.js src
```

## Real result

```
src/middleware/auth.js
  18:12  warning  'err' is defined but never used  no-unused-vars

src/middleware/errorHandler.js
  1:36  warning  'next' is defined but never used  no-unused-vars
  5:45  warning  'next' is defined but never used  no-unused-vars

✖ 3 problems (0 errors, 3 warnings)
```

**3 warnings, 0 errors, across the entire backend (1,620 lines).** Both findings are
Express-framework false positives rather than real smells: Express's error-handling
middleware signature requires 4 parameters `(err, req, res, next)` even when `next` is
unused (that's how Express recognises it as an error handler, not a regular one), and
`auth.js`'s catch-all `catch (err)` intentionally ignores the specific error (any failure
to verify a token should look the same to the client: "not authorized"). Both are
defensible as-is; flagging them here is what a real static-analysis pass is for — that
their explanation holds up is the good news, not a reason to have skipped looking.

## If the group wants a real SonarQube run for the report

```bash
# needs Docker, which the project rubric does not require but the group's own
# machines likely have:
docker run -d --name sonarqube -p 9000:9000 sonarqube:community
# then, after creating a project + token in the SonarQube UI at localhost:9000:
cd backend && npx vitest run --coverage   # produces a coverage/lcov.info SonarQube can read
npx sonar-scanner \
  -Dsonar.projectKey=tutorhub \
  -Dsonar.sources=src \
  -Dsonar.javascript.lcov.reportPaths=tests/coverage/lcov.info \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=<your token>
```

A `sonar-project.properties` file matching this is included in this folder
(`sonar-project.properties`) so the scanner picks up the right settings without re-typing
the flags above.

## Update 2026-11-25 — re-run, frontend scan, and what static analysis could not see

- Backend re-run: identical result, **3 warnings, 0 errors** (`Evidence/eslint-quality-output.txt`).
- Frontend (`cd frontend && npx oxlint`, 2,559 lines): **20 warnings, 0 errors**
  (`Evidence/oxlint-frontend-output.txt`). Mostly `react-hooks/exhaustive-deps` (a `useEffect` calls a
  loader function that is not in its dependency list, e.g. `admin/ClassDetail.jsx`) and one
  `set-state-in-effect`. These are real maintainability smells, not crashes; the likely user-visible one is
  the stale "Enrolled students" tile found by the UI test (OBS-01).
- **Blind spot:** with 0 ESLint errors the backend still contained a defect that kills the server
  (Issue-2). Linting cannot know that Express 4 ignores rejected promises from async handlers. Static
  analysis is a floor, not proof of quality.
