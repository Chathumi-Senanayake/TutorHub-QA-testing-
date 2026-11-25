# Issue 3 (DEF-BB-03): Malformed id in the URL gives HTTP 500 and leaks a stack trace

**Found by:** Member 3 (DT-X1), 2026-11-25. UI screenshot:
`Member-3/Black-Box-Testing/Execution/Evidence/Screenshots/BB-UI-13_malformed_class_id_raw_error.png`.
Re-confirmed by Newman (`[DEF-BB-03]` request). **Severity: Low-Medium.**

| Life-cycle | Status |
|---|---|
| New | 2026-11-25 |
| Assigned | Member 4 (tracking) |
| Fixed / Retest / Closed | — |

## Steps to reproduce
Log in, then `GET /api/classes/not-an-id` (or open `/dashboard/classes/not-an-id` in the app).
**Expected:** `400`/`404` with a friendly message. **Actual:** `500` with body
`Cast to ObjectId failed for value "not-an-id" ... model "ClassGroup"` **and a `stack` field containing
server file paths** (`C:\...\backend\node_modules\mongoose\...`). The UI prints the raw Mongoose text.

## Root cause (short Five Whys)
1. 500 because `ClassGroup.findById('not-an-id')` throws `CastError`.
2. Nothing validates the id first (`loadClassGroup` just forwards the raw error).
3. `errorHandler` returns `err.message` and, unless `NODE_ENV === 'production'`, `err.stack`.
4. No test used a malformed id (unit tests use valid mock ids).
5. **Root cause:** no validation of path parameters + an error handler that exposes internals outside production.

## Suggested fix
Validate with `mongoose.isValidObjectId(id)` in `loadClassGroup` (-> 404), map `CastError` to 400 in
`errorHandler`, and include `stack` only when `NODE_ENV === 'development'` is set explicitly.
Retest: Newman `[DEF-BB-03]` request and `run-blackbox.mjs` case DT-X1.
