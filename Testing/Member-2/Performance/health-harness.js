// A minimal harness isolating the ONE route in server.js that needs no database
// (GET /api/health), so a real load test can run even in an environment with no
// MongoDB available. It is a copy of that one route, not the full app - every
// other TutorHub endpoint needs a real MongoDB connection to load-test for real
// (see tests/performance/README.md for the full-endpoint .jmx plan).
import express from 'express';
import { fileURLToPath } from 'url';

export function buildHealthOnlyApp() {
  const app = express();
  app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
  return app;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const app = buildHealthOnlyApp();
  const port = 5099;
  app.listen(port, () => console.log(`health-only harness listening on ${port}`));
}
