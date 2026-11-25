# Evidence screenshots — Member 2 (Security)

This folder is empty on purpose: the bcrypt/JWT walkthrough quoted in `../Security_Testing_Report.md`
and in the project report is real, but it was run in the sandbox this project was built in,
not on your own computer. Run it yourself and put the real screenshot here.

## Steps (on your own computer, Node.js installed, no MongoDB needed for this one)

```bash
cp ../security_walkthrough.mjs backend/security_walkthrough.mjs
cd backend
node security_walkthrough.mjs
```

Screenshot the terminal output and save it as:

```
Testing/Member-2/Security/Evidence/Screenshots/SEC01_bcrypt_jwt_walkthrough.png
```

Then delete `backend/security_walkthrough.mjs` (it's a one-off demo script, not part of the app).

## Optional — only with the real app running

| File name to use | What to try | What "pass" looks like |
|---|---|---|
| `SEC02_nosql_injection_attempt.png` | Try a NoSQL-injection-style payload in the login form | Request rejected / treated as a plain string |
| `SEC03_no_token_blocked.png` | Call a protected route with no Authorization header (dev tools Network tab) | 401 response |
| `SEC04_cross_student_access_blocked.png` | Log in as Student A, try to view Student B's class data | 403 Forbidden |

See `../../Test-Environment/Test_Environment.md` for how to get the app running for real.
