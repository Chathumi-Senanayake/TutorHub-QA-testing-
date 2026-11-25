# Selected Function Analysis — `authController.register()` (Lesson 4)

The highest-complexity function in the backend (M = 9, see `../Cyclomatic-Complexity/`),
and the one with the most real, independent decision points. Full source
(`backend/src/controllers/authController.js`):

```js
export async function register(req, res) {
  const { name, email, password, role, grade } = req.body;
  if (!name || !email || !password || !role) {                 // branch A
    return res.status(400).json({ message: '...' });
  }
  if (!['teacher', 'student'].includes(role)) {                 // branch B
    return res.status(400).json({ message: '...' });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {                                                // branch C
    return res.status(409).json({ message: '...' });
  }
  const user = await User.create({
    name, email, password, role,
    grade: role === 'student' ? grade || null : null,            // branch D (ternary) + branch E (||)
  });
  const token = generateToken(user);
  res.status(201).json({ token, user: sanitize(user) });
}
```

## Control-flow graph (described)

```
START -> [branch A: missing field?] --yes--> 400 -> END
            | no
            v
         [branch B: role not teacher/student?] --yes--> 400 -> END
            | no
            v
         [branch C: existing user found?] --yes--> 409 -> END
            | no
            v
         [branch D: role === 'student'?] --yes--> [branch E: grade truthy?] --yes--> grade=grade
            |                                          | no                -> grade=null
            | no
            v
         grade = null
            |
            v
         create user -> sign token -> 201 -> END
```

(An image of this graph, drawn the same way as `White-Box-Testing/Control-Flow-Graph/` in
a reference project, is a reasonable next addition if the group wants one for the report —
left as plain text here since the branches are simple enough to read directly.)

## Which real test exercises which branch

| Branch | Condition | Covered by (real, passing test in `backend/tests/unit/authController.test.js`) |
|---|---|---|
| A (true) | a required field missing | `"rejects when a required field is missing..."` |
| A (false) → B (true) | role is neither teacher nor student | `"rejects a role outside {teacher, student}"` |
| A, B (false) → C (true) | email already registered | `"rejects a duplicate email with 409"` |
| A, B, C (false), D (true), E (true) | new student WITH a grade | `"creates a student account and returns a token on valid input"` |
| A, B, C (false), D (true), E (false) | *not directly tested* — a student registering with no grade | — (gap, see below) |
| D (false) | teacher account (grade forced to null) | `"forces grade to null for a teacher account even if the client sends one"` |

**Branch coverage achieved: 5 of 6 meaningful branches (83%).** The one gap — a student
registering with `grade` omitted entirely (not just falsy) — is a legitimate addition for
whoever extends this test file next; it's a low-risk gap (the `||` already defaults it to
`null` the same way a falsy grade does), but white-box testing's whole point is naming
gaps like this explicitly rather than assuming "it's probably fine".

## Statement coverage

Every statement in `register()` is reached by at least one of the 5 tests above (confirmed
by the real coverage run: `authController.js` is at **96.15% statement coverage**, see
`Testing/Member-5/Quality-Metrics/Code_Coverage_Summary.md` — the uncovered line is inside
`login()`, not `register()`, since both functions live in the same file).
