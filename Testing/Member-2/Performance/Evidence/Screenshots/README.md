# Evidence screenshots — Member 2 (Performance)

This folder is empty on purpose: the load-test numbers quoted in `../README.md` and in the
project report are real, but they were run in the sandbox this project was built in, not on
your own computer. Run it yourself and put the real screenshot here.

## Steps (on your own computer, Node.js installed, no MongoDB needed for this one)

```bash
cd backend
node tests/performance/health-harness.js &
npx autocannon -c 50 -d 10 http://localhost:5099/api/health
```

Screenshot the terminal output (the whole table autocannon prints) and save it as:

```
Testing/Member-2/Performance/Evidence/Screenshots/PERF01_autocannon_health_loadtest.png
```

Then stop the harness (`fg` then Ctrl+C, or `kill %1`).

## Optional — only if you also run the real JMeter plan

| File name to use | What to screenshot |
|---|---|
| `PERF02_jmeter_summary_report.png` | JMeter's Summary Report listener after a run |
| `PERF03_jmeter_response_time_graph.png` | The Response Time Graph listener |

See `../README.md` for the exact JMeter commands (needs a live backend + MongoDB + seed data).
