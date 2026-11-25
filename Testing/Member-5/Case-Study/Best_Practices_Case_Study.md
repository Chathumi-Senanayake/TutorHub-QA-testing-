# Case Study & Industry Best Practices (Lesson 10) — Member 5

## Real-world failures caused by insufficient QA

| Incident | What happened | Root cause (QA angle) | Cost |
|---|---|---|---|
| **Knight Capital (2012)** | Old test/deployment code was accidentally left active on one of eight production servers | No consistent deployment process across servers; the leftover code was never caught because production and test environments weren't verified to be identical | ~$440 million in 30 minutes |
| **Therac-25** | A radiation-therapy machine's software bug caused massive overdoses | Race condition in input handling, never caught because hardware interlocks from the earlier model (that would have caught it mechanically) were removed and not re-verified in software | Multiple deaths |
| **Ariane 5 (1996)** | Rocket self-destructed 37 seconds after launch | A 64-bit float-to-16-bit-integer conversion overflowed; the code was reused from Ariane 4 without re-testing it against Ariane 5's different flight parameters | ~$370 million |
| **Boeing 737 MAX (MCAS)** | Software over-corrected based on a single faulty sensor reading, contributing to two crashes | Insufficient failure-mode testing of a single point of sensor failure; insufficient scrutiny of a safety-critical system change | 346 deaths, $20B+ |
| **CrowdStrike (2024)** | A faulty content update crashed millions of Windows machines worldwide | A bad update was pushed to all customers at once with no staged/canary rollout | Global outage, billions in downstream cost |

## What TutorHub's own (much smaller-scale) QA approach borrowed from these

1. **Like Knight Capital** — the project keeps one `backend/.env` per environment and a
   `npm run seed` script with clearly fake data (`teacher1@test.lk`, etc.), so there's no
   path for test/demo accounts to be mistaken for real production data.
2. **Like Ariane 5** — reused logic is re-tested when its *conditions* change, not assumed
   safe because it worked before: the attendance-percentage function was pulled out and
   re-tested on its own (`Member-3/TDD/`) specifically because it was about to be reused
   outside its original single call site.
3. **Like Boeing 737 MAX** — a single point of failure was looked for deliberately:
   `respondToEnrollment()`'s missing capacity check (`Member-4/Defects/Issue-1/`) is exactly
   this pattern at a much smaller scale — one function trusted to enforce a safety/business
   rule that it silently doesn't.
4. **Like CrowdStrike** — the CI workflow (`Member-4/Automation/CI-CD/`) runs the full test
   suite on every push *before* anything is considered "ready", rather than testing only
   right before a demo.

## Testing Pyramid, applied to this project

```
        /\
       /  \      a few, slow: BDD scenarios (Member-3/BDD) - 5 scenarios
      /----\
     /      \    some, medium: API integration - Newman, 50 requests /
    /--------\   77 assertions, EXECUTED against live server+DB
   /          \
  /------------\ many, fast: unit tests (Member-3/White-Box, Member-2/Security)
                  64 tests, runs in ~2 seconds
```

TutorHub's real test suite already shapes like the pyramid recommends: the most tests
are fast unit tests with no external dependencies, fewer are BDD scenarios, and the
integration layer (live server + database) was executed with Newman and found defects the
mocked unit layer structurally could not (Issue-2). The pyramid is a shape to aim for, not a
substitute for the top layers.

## Shift-Left / Shift-Right

- **Shift-Left** (test earlier): the CI workflow runs tests on every push, and the TDD
  cycle in `Member-3/TDD/` wrote the test *before* the code existed at all — as early left
  as testing gets.
- **Shift-Right** (keep watching after release): not yet applicable — TutorHub hasn't been
  deployed to real users. Once it is, basic monitoring (uptime checks on `/api/health`,
  error-rate logging) would be the natural next step, and `/api/health` already exists
  specifically to support that later.

## A TutorHub incident of our own (real, found 2026-11-25)

| What happened | Root cause (QA angle) | Impact | Fix status |
|---|---|---|---|
| One `POST /api/auth/register` with a 3-character password kills the whole API process | Async handlers without error propagation in Express 4 + validation left to the schema; unit tests mocked the models so the validator never ran | Anonymous denial of service, 3 crashes in one test run | Open (Issue-2) |

It rhymes with the case-study failures above, at toy scale:

- **Ariane 5 / reuse without re-verifying conditions:** the design sheets *assumed* "schema `minlength` -> clean 400"
  and the unit tests mocked that layer, so the assumption was never executed against the real stack.
- **Knight Capital / environment differences:** mocked test environment vs. real runtime behaved differently.
- **Boeing MCAS / single point of failure:** one unguarded code path (every async controller) takes everything down.

### Practices this suggests (and which one the project actually did)

| Practice | Status in this project |
|---|---|
| Test the real stack, not only mocks (shift-left *and* integration) | Done late: live black-box + Newman run found 4 defects the mocked suite missed |
| Automate regression so a fix stays fixed | Done: the last Newman folders fail until Issues 1-4 are fixed, then protect them |
| Add a global async error wrapper + `unhandledRejection` safety net | **Not done** (recommended in Issue-2) |
| Run a process manager (restart on crash) in deployment | Not applicable yet (not deployed) |
| Staged rollout / monitoring (CrowdStrike lesson) | Not applicable yet; `/api/health` exists for later uptime checks |
| Treat green metrics sceptically | Documented in `Quality-Metrics/Test_Execution_Metrics.md`, section 4 |
