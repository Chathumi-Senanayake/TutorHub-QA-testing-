# Security Testing (Lesson 7) — Member 2

Three things are checked here, all against the real TutorHub code and real libraries
(`bcryptjs`, `jsonwebtoken`) — nothing below is simulated or assumed.

## 1. Passwords are actually hashed, never stored in plain text

`models/User.js` hashes `password` with `bcryptjs` in a `pre('save')` hook before it ever
reaches MongoDB. Run live (output below is the real, unedited console output of running
`bcryptjs` exactly the way `User.js` does):

```
plaintext: secret1
hash #1:   $2a$10$sYYWxABqWvQEWzaqqsJIb.BSezyiNj9JZIYHdn4uVVt3t58BeN7TW
hash #2:   $2a$10$AeGvcMF7FMkAffqCWrzpseeOqi4oFJhXxgitr9FRXZPzfDFqGWrwq
hashes differ even for the same password (random salt): true
compare(correct pw, hash1): true
compare(wrong pw,   hash1): false
```

Two things this proves: (1) the same password never produces the same stored value twice
(a random salt per hash, so a leaked database can't be searched for matching passwords),
and (2) `comparePassword()` correctly accepts the right password and rejects a wrong one —
confirmed again, with the real controller logic, in
`backend/tests/unit/authController.test.js` ("rejects a wrong password with 401",
"logs in successfully with correct credentials").

## 2. Tokens can't be forged, tampered with, or reused after they expire

`middleware/auth.js` uses `jsonwebtoken` to sign and verify every request's token. Real,
unedited output of signing and verifying a token the same way:

```
issued token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InUxIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3OTU2MTAxMTUsImV4cCI6MTc5NTYxMDExNn0.-vS1OAKOKAuGCdojPDTx7SHHGCgmRQOLgM1-7t7wA7Y
verify with correct secret: {"id":"u1","role":"student","iat":1795610115,"exp":1795610116}
verify with WRONG secret throws: invalid signature
verify TAMPERED token throws: invalid signature
verify EXPIRED token (after 1.2s, maxAge 1s) throws: jwt expired
```

A token signed with a different secret, or edited by even 4 characters, is rejected with
`invalid signature`; an expired token is rejected with `jwt expired`. The real middleware
behaviour for each of these cases (no token, malformed header, bad token, deleted user) is
covered by `backend/tests/unit/authMiddleware.test.js` — all 8 of those tests pass (see
`Testing/Member-5/Quality-Metrics/Code_Coverage_Summary.md`: `middleware/auth.js` is at
**100% statement and branch coverage**).

## 3. A student can only ever see their OWN class data (authorization / access control)

This is the security property that matters most for TutorHub specifically: the whole app
is built around "many students, many teachers, many classes", so the real risk isn't a
clever exploit — it's a route that forgets to check *whose* data is being requested.
`backend/tests/unit/classAccess.test.js` proves, against the real middleware functions in
`middleware/classAccess.js`:

| Check | Real test | Result |
|---|---|---|
| A teacher cannot manage a class owned by a different teacher | `requireOwnerTeacher`: "403s another teacher trying to manage a class they do not own" | pass |
| A student cannot read a class's quizzes/materials/attendance/payments before being approved | `requireApprovedStudent` / `requireClassMember`: "403s a student with no enrollment", "cannot see a class they never joined" | pass |
| A student's pending (not-yet-approved) request does not grant access | `requireApprovedStudent`: "403s a student whose request is still pending" | pass |
| **The core isolation rule**: one student cannot read a different class's data through the shared read-access guard | `requireClassMember`: "403s a student trying to read a DIFFERENT student's class data (core isolation rule)" | pass |

All 12 tests in that file pass; `middleware/classAccess.js` is at 89.6% statement / 100%
branch coverage (the uncovered lines are the `catch` blocks for a database error, which
cannot be reached without a real, failing database connection).

## What this does NOT cover (needs a live server — ready-to-run)

Things that need an actual running server + browser/HTTP client, not exercised in this
sandbox: confirming the HTTP responses carry the right status codes over the wire (not
just inside the function call), CORS header behaviour, rate-limiting (TutorHub currently
has none — worth a line in the report's "future work"), and NoSQL-injection-style checks on
free-text fields (`name`, `description`, notice `body`, etc. — Mongoose's schema typing
already blocks most of the classic `{"$gt": ""}` style NoSQL injection on fields typed as
`String`, since Mongoose casts the query value to the field's declared type, but this is
worth a manual check once the server is running: see the "Security" folder of the
Postman collection in `Testing/Member-4/Automation/API/` for a few requests to try with
injection-style payloads in the `name`/`description` fields).
