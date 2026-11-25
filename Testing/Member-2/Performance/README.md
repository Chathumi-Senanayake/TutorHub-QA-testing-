# Performance Testing (Lesson 7) — Member 2

## What was actually run (real numbers, no MongoDB needed)

`GET /api/health` is the one route in the whole backend that touches no database, so it's
the only endpoint this sandbox could load-test end-to-end for real. `health-harness.js`
mounts that exact route in a tiny standalone Express app; `autocannon-health-results.json`
is the raw, unedited output of actually running:

```bash
npx autocannon -c 50 -d 10 http://localhost:5099/api/health
```

**Real result:** 50 concurrent connections for 10 seconds → **80,120 requests**, **8,012.7
requests/sec average**, **5.76ms average latency**, **18ms p99 latency**, **0 errors, 0
timeouts**. This is a load test, not a stress test (50 connections is well within what a
single tuition-class app should expect), and the result says the server handles it with no
problems — exactly what a load test is supposed to confirm.

## What needs your own machine (ready-to-run, not executed here)

`TutorHub_Performance_Testing.jmx` is a real Apache JMeter test plan with two thread
groups, built for the two DB-backed endpoints most worth testing under load:

1. **Load test** — 50 students submitting a quiz attempt at once (`POST
   /api/classes/:id/attempts`), ramped over 5s, for 30s. This is the realistic "everyone
   submits right before the deadline" scenario.
2. **Stress test** — 200 users logging in at once (`POST /api/auth/login`), ramped over
   10s, for 30s — well past a normal expected load, to see how (or whether) it degrades.

To run it for real:

```bash
# 1. backend/ needs a real MongoDB connection + seed data:
cd backend && npm run seed && npm run dev
# 2. get a real student JWT (POST /api/auth/login) and a real class/quiz id (e.g. from
#    the seeded data or the Postman collection in Testing/Member-4/Automation/API/),
#    and paste them into the jmx file's User Defined Variables
# 3. with JMeter installed:
jmeter -n -t TutorHub_Performance_Testing.jmx
# results land in results-quiz-submit.jtl / results-login-stress.jtl next to this file
```

## Reading the results (either tool)

- **Average/p99 latency** — is the typical and worst-case response time acceptable for a
  page a student is staring at mid-exam? (Under ~200ms is a reasonable bar for this kind
  of app.)
- **Error/timeout count** — any non-zero value here is a real finding, not noise: it means
  the server (or MongoDB's connection pool) couldn't keep up.
- **Throughput (req/sec)** — the ceiling before response times start climbing.
