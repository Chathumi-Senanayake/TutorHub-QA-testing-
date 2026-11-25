// API automation (Lesson 6). Runs the whole collection with Newman and writes an HTML + JUnit report.
//   1. cd backend && npm install && npm run seed && npm run dev   (MongoDB running)
//   2. npm install newman newman-reporter-htmlextra   (here or globally)
//   3. node run-newman.js
// Tokens/ids are captured by the collection's own test scripts (pm.environment.set).
// Exit code is 1 if any assertion fails — the last folder (known defects) is EXPECTED to fail.
const newman = require('newman');

newman.run(
  {
    collection: require('./TutorHub_API_Tests.postman_collection.json'),
    environment: require('./TutorHub_Local.postman_environment.json'),
    reporters: ['cli', 'htmlextra', 'junit', 'json'],
    reporter: {
      htmlextra: { export: './reports/api-report.html', title: 'TutorHub API tests (Newman)' },
      junit: { export: './reports/newman-junit.xml' },
      json: { export: './reports/newman-run.json' },
    },
  },
  (err, summary) => {
    if (err) { console.error(err); process.exit(1); }
    const a = summary.run.stats.assertions;
    console.log(`\n${summary.run.stats.requests.total} requests, ${a.total} assertions, ${a.failed} failed`);
    process.exit(a.failed ? 1 : 0);
  }
);
