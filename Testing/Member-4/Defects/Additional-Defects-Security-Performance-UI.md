# Additional defects found by Member 1 (manual UI) and Member 2 (security, performance, usability) — 2026-11-25

All found by running the real app (API + MongoDB + React UI). Evidence paths are relative to `Testing/`.
Status of every item: **New / not fixed**.

| ID | Title | Severity | Evidence |
|---|---|---|---|
| Issue-2 (addendum) | NoSQL-operator payloads also crash the API (same root cause as Issue-2) | High | `Member-2/Security/security-probe-console.txt` SEC-04..07 |
| Issue-5 | Quiz (and session) update accepts the whole request body: a teacher can move their quiz into another teacher's class | Medium | SEC-14 |
| Issue-6 | Uploaded HTML is served back from the API origin as `text/html` (stored-XSS vector; no file-type filter) | Medium | SEC-20 |
| Issue-7 | No rate limiting on login (40 wrong passwords in ~4 s, none throttled) | Medium | SEC-21 |
| Issue-8 | Login blocks the whole server: 11 logins/s max; at 200 concurrent logins 192 time out; `/health` drops from ~6,455 to ~7 req/s while 20 users log in | Medium | `Member-2/Performance/results/` |
| Issue-9 | No security headers; `X-Powered-By: Express` exposed | Low | SEC-18 |
| GAP-1 | Students have **no screen to attempt a quiz** (README promises it); quizzes only show "Open" | Medium (missing feature) | `Member-1/.../TC21g` |
| GAP-2 | Teachers cannot **edit** a quiz in the UI (create/delete only) | Low | TC13 notes |
| OBS-02 | Teacher attendance tab overflows horizontally on a 375 px phone (661 px wide) | Low | `Member-2/.../USAB07` |
| OBS-03 | Anyone can self-register as a *teacher* and publish classes (design choice; recorded) | Info | SEC-15 |

## Root causes (short) and fixes

**Issue-2 addendum.** `login()` calls `email.toLowerCase()` on whatever JSON was sent; an object throws a `TypeError` inside an
async handler -> unhandled rejection -> process exit. Same for `register` and for `Class.create({name:{...}})` (Mongoose
`CastError`). Fix together with Issue-2 (async error wrapper) and add `typeof x === 'string'` checks on credentials.
Note: no authentication bypass was achieved — the operators are never evaluated by MongoDB; the harm is the crash.

**Issue-5.** `updateQuiz` / `updateSession` pass `req.body` straight to `findOneAndUpdate` (mass assignment). Class update is safe
because it whitelists fields (SEC-13 passes). Fix: whitelist (`title, subject, order, dueDate, durationMinutes, questions, published`).
The same pattern exists in `updateSession` (read from code; not separately probed).

**Issue-6.** `upload.js` has only a size limit and `express.static` serves `/uploads` on the API origin. Fix: allow-list types
(pdf/docx/png/jpg), serve with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`.

**Issue-7 / Issue-9.** No `express-rate-limit`, no `helmet`. Fix: add both (`app.disable('x-powered-by')` at minimum).

**Issue-8.** `bcryptjs` is pure JavaScript, so each hash (cost 10) blocks the single Node event loop for ~90 ms; all other
requests wait. Fix: use native `bcrypt` (thread pool) or `bcryptjs` async with batching, plus the rate limit from Issue-7.

**GAP-1 / GAP-2.** Frontend pages `student/ClassDetail.jsx` and `admin/ClassDetail.jsx` have no quiz-taking / quiz-edit components;
the API already supports both (`POST /attempts`, `PATCH /quizzes/:id`).

**OBS-02.** The attendance table/tab strip has a fixed minimum width; wrap in `overflow-x-auto` or stack rows on small screens.

## Retest
Re-run `Testing/Member-2/Security/security-probes.mjs` (SEC-04..07, 14, 17, 18, 20, 21 must pass), the autocannon commands in
`Member-2/Performance/README.md`, and `node run-newman.js`.
