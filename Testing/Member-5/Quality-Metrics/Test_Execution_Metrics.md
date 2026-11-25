# Test Execution & Defect Metrics (Lesson 9) — Member 5

Numbers below come from **real runs on 2026-11-25** (raw outputs are linked). Nothing is estimated.

## 1. Size of what was tested

| Part | Lines (`wc -l`) |
|---|---|
| Backend `src/` | 1,620 (1.62 KLOC) |
| Frontend `src/` (.js/.jsx) | 2,559 |

## 2. Test execution results

| Suite | Executed | Passed | Failed | Pass rate | Evidence |
|---|---|---|---|---|---|
| Unit + security (Vitest, mocked DB) | 64 tests / 8 files | 64 | 0 | 100% | `Evidence/vitest-coverage-output.txt` |
| BDD (Cucumber) | 5 scenarios / 18 steps | 5 / 18 | 0 | 100% | `Member-4/Automation/CI-CD/Evidence/cucumber-run-output.txt` |
| Black-box vs live API (EP + BVA + Decision Tables) | 63 cases | 55 | 8 | 87.3% | `Member-3/Black-Box-Testing/Execution/` |
| API automation (Newman, live API) | 50 requests, 77 assertions | 71 assertions | 6 | 92.2% of assertions | `Member-4/Automation/API/reports/` |

Black-box by technique: EP 17 pass / 2 fail, BVA 12 / 4, Decision Table 26 / 2.
The failing cases and assertions are the 4 defects below, not random flakiness (re-run reproduces them).

## 3. Defect metrics

| Metric | Value |
|---|---|
| Defects found (distinct) | **4** (Issue-1 .. Issue-4) + 1 UI observation |
| Defect density (backend) | 4 / 1.62 KLOC = **2.47 defects per KLOC** (previous report: 0.62, when only Issue-1 was known) |
| Severity distribution | High 1 · Medium 1 · Low-Medium 2 |
| Defects fixed / open | 0 fixed / 4 open (no code was changed by the QA pass) |
| Defect removal efficiency (DRE) | Not measurable yet: DRE = found-before-release / (found-before + found-after); there are no post-release defects because the app is not deployed |

### Which technique found which defect (defect detection by method)

| Defect | Unit tests | Static analysis (ESLint/oxlint) | Black-box live run | Newman |
|---|---|---|---|---|
| Issue-1 capacity not enforced | documents it (BUG test passes) | no | **found** | reproduced |
| Issue-2 short password / bad id **crashes API** | no (models mocked) | **no** | **found** | reproduced (connection reset) |
| Issue-3 malformed id -> 500 + stack leak | no | no | **found** | reproduced |
| Issue-4 negative capacity / fee accepted | no | no | **found** | reproduced |

## 4. The lesson these metrics teach

All the "green" quality numbers said the backend was healthy: 64/64 unit tests, 5/5 BDD scenarios,
**0 ESLint errors**, 100% coverage on the files with the most logic. Yet a single anonymous request
could kill the server (Issue-2). Reasons: unit tests mocked the database, so the real schema validator
never ran; static analysis cannot see that Express 4 does not catch async errors; and coverage counts
lines executed, not behaviours checked. **Metrics measure the tests, not the product** — only executing
black-box tests against the running system exposed the highest-severity defect.

## 5. Not measurable / not done (stated plainly)

- **SonarQube:** not run. It needs a SonarQube server (Docker); the Docker daemon is not running on this machine.
  `sonar-project.properties` is ready; ESLint/oxlint results below are the substitute signal.
- **MTTF / MTTR / MTBF:** no production usage yet. The only observed failure data is this: the API process
  died 3 times in one test run, each caused by one of the Issue-2 inputs, and needed a manual restart.
- **Frontend automated tests / coverage:** none exist (0%).
