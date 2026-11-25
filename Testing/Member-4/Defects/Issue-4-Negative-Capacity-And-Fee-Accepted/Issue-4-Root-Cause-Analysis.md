# Issue 4 (DEF-BB-04): Negative `maxStudents` and `monthlyFee` are accepted

**Found by:** Member 3 exploratory BVA (BVA-14, BVA-15), 2026-11-25. Re-confirmed by Newman (two
`[DEF-BB-04]` requests). **Severity: Low-Medium.**

| Life-cycle | Status |
|---|---|
| New | 2026-11-25 |
| Assigned | Member 4 (tracking) |
| Fixed / Retest / Closed | — |

## Steps to reproduce
`POST /api/classes` as a teacher with `{"name":"x","maxStudents":-1}` and, separately,
`{"name":"x","monthlyFee":-500}`. **Expected:** `400`. **Actual:** `201`, values stored as sent.
(`0` for either value silently becomes the default 15 / 3000 because of `value || default`, so a free class
cannot be created either.)

## Root cause (short Five Whys)
1. Stored because `createClass()` copies the numbers straight into `ClassGroup.create`.
2. The schema has no `min` validators and the controller does no range check.
3. The UI form has `min` attributes, which API clients bypass.
4. The original BVA sheet covered the password and the 15-seat limit, not the lower bound of class settings.
5. **Root cause:** missing server-side range validation.

## Suggested fix
`maxStudents: { type: Number, min: 1 }`, `monthlyFee: { type: Number, min: 0 }`, use `??` instead of `||`
for defaults, and return `400` on `ValidationError`. Retest: Newman `[DEF-BB-04]` requests; BVA-13/14/15.
