# Issue 2 (DEF-BB-02): A too-short password — or a malformed enrollment id — crashes the whole API

**Found by:** Member 3 black-box execution (EP-01, BVA-01, DT-X2), 2026-11-25. Re-confirmed by the
Newman suite (`Automation/API`, last request). **Severity: High. Priority: fix before release.**

## Bug life-cycle
| State | Status |
|---|---|
| New | reported 2026-11-25 |
| Assigned | Member 4 (tracking); fix owner: backend developer |
| In Progress / Fixed / Retest / Closed | — (not fixed) |

## Steps to reproduce
1. Start the API (`npm start` in `backend/`).
2. `POST /api/auth/register` with `{"name":"x","email":"a@b.lk","password":"pq1","role":"student"}`.
3. **Expected:** `400` validation error; server keeps running (the EP/BVA design sheets expect this).
4. **Actual:** the HTTP connection is dropped and the Node process **exits** (`Node.js v24.15.0` printed
   after a `ValidationError`). Every other user is cut off until someone restarts the server.
   Same result for `PATCH /api/classes/:id/enrollments/zzz` (malformed id -> `CastError`).

Real evidence: `Testing/Member-3/Black-Box-Testing/Execution/Evidence/server-crash-log.txt`,
`.../Execution/console-output.txt` (EP-01, BVA-01, DT-X2), Newman output in `Automation/API/reports/`.

## Root cause (Five Whys)
1. **Why did the server exit?** An unhandled promise rejection; Node 15+ terminates the process on one.
2. **Why unhandled?** `register()` (and every other controller) is an `async` function awaiting Mongoose
   calls with no `try/catch`, and **Express 4 does not forward a rejected promise from an async handler
   to the error middleware**.
3. **Why is nothing catching it?** `errorHandler` only runs for errors passed to `next(err)` or thrown
   synchronously; there is no async wrapper (e.g. `express-async-errors`) and no `unhandledRejection` handler.
4. **Why wasn't the bad password stopped earlier?** `register()` only checks that fields exist; the
   length rule lives only in the Mongoose schema (`minlength: 6`), whose error then triggers step 2.
5. **Why not caught in testing?** Unit tests mock the models, so the schema validator never ran; the
   design sheets assumed a clean 400 without executing it. Only live black-box execution exposed it.

**Root cause:** async controllers without error propagation in Express 4, plus validation left to the schema.

## Impact
Any anonymous client can stop the service with one small request (denial of service). The web form hides
this (HTML `minLength`), but API clients are not bound by it.

## Suggested fix
```js
// server.js (first import):  import 'express-async-errors';   // or wrap handlers in a catchAsync()
// authController.register():
if (password.length < 6) return res.status(400).json({ message: 'password must be at least 6 characters' });
// errorHandler: map err.name === 'ValidationError' | 'CastError' to 400
// safety net: process.on('unhandledRejection', (e) => console.error(e));
```

## Retest plan
Re-run `run-blackbox.mjs` (EP-01, BVA-01, DT-X2 must pass, no restart message) and `node run-newman.js`
(last folder green). Add a unit test that uses the real schema validator.
