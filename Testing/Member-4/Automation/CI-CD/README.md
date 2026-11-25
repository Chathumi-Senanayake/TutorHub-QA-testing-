# CI/CD (Lesson 6) — Member 4

**Status: real and wired up.** `tutorhub-tests.yml` here is a copy of the actual workflow
file at `.github/workflows/tutorhub-tests.yml` in the project root — GitHub Actions reads
it from that exact path, so once this project is pushed to GitHub it will run for real on
every push and pull request to `main`.

## What it runs

Two jobs' worth of steps, both against the `backend/` folder:

1. `npx vitest run --coverage` — the same unit + security tests in
   `backend/tests/unit/` that are documented in
   `Testing/Member-3/White-Box-Testing/` and `Testing/Member-2/Security/`.
2. `npx cucumber-js` — the same BDD scenarios in `backend/tests/bdd/` documented in
   `Testing/Member-3/BDD/`.

Both commands were actually run locally while building this Testing/ folder (not just
written and hoped to work) — see the real pass/fail counts in
`Testing/Member-5/Quality-Metrics/Code_Coverage_Summary.md`.

## Why there's no "deploy" step (no full CD yet)

A real Continuous *Deployment* step (auto-deploying to a server after tests pass) needs a
hosting target (Render, Railway, a VM) and its secrets configured in the GitHub repo
settings — that's a one-time setup only the project owner can do, so it's left as a
`# TODO: add a deploy job here once we pick a host` comment rather than guessed at. The CI
half (automatically testing every change) is complete and real.

## What to screenshot for the report

Once this is pushed to GitHub: the Actions tab showing a green run, and the uploaded
`vitest-coverage` / `cucumber-report` artifacts from that run — these are the CI/CD
"evidence" screenshots the rubric/task list asks for.

## Local run of the exact CI steps (2026-11-25)

The two CI commands were re-run locally; raw output is saved in `Evidence/`:
- `Evidence/vitest-run-output.txt` — **8 test files, 64 tests passed**, coverage 45.68% statements.
- `Evidence/cucumber-run-output.txt` — **5 scenarios, 18 steps passed**.

This folder is not a git repository and has not been pushed to GitHub, so **no GitHub Actions run exists yet**;
that screenshot can only be taken after pushing (Actions tab).
