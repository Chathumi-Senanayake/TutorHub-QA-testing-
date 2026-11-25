// Black-box test execution — Member 3 (Lesson 4: EP, BVA, Decision Tables)
//
// Runs every row of the three design sheets in ../ against the LIVE TutorHub API
// (Express + real MongoDB). Black-box: only HTTP in, HTTP out — no code is imported.
//
// Usage (from backend/, with the API already running on BASE and a seeded/empty DB):
//   node ../Testing/Member-3/Black-Box-Testing/Execution/run-blackbox.mjs
// Env: BASE (default http://localhost:5000/api), OUT_DIR (default: this folder)
// Optional: if the server dies mid-run (a crashing request), the runner restarts it with
// `node src/server.js` in the current working directory using the current environment.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE || 'http://localhost:5000/api';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.OUT_DIR || HERE;
const RUN = Date.now().toString(36); // keeps e-mails unique per run
const ORIGIN = BASE.replace(/\/api$/, '');

const transcript = []; // every HTTP exchange, in order
const results = []; // one row per black-box test case
let currentCase = null;

// ───────────────────────── HTTP helper ─────────────────────────
async function api(method, url, { token, body, timeoutMs = 6000, raw } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const started = Date.now();
  let status = 0;
  let data = null;
  let error = null;
  try {
    const res = await fetch(BASE + url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    status = res.status;
    const text = await res.text();
    try { data = JSON.parse(text); } catch { data = text; }
  } catch (e) {
    error = e.name === 'TimeoutError' ? `no response within ${timeoutMs} ms` : e.message;
  }
  const entry = {
    case: currentCase,
    request: { method, url: `/api${url}`, auth: token ? 'Bearer <jwt>' : 'none', body: raw ?? body ?? null },
    response: error ? { error } : { status, body: trim(data) },
    ms: Date.now() - started,
  };
  transcript.push(entry);
  return { status, data, error };
}

function trim(d) {
  const s = JSON.stringify(d);
  if (s && s.length > 1500) {
    // keep stack traces and long payloads out of the log, but keep the message
    return d && d.message ? { message: d.message, '…': 'trimmed' } : s.slice(0, 1500) + '…';
  }
  if (d && typeof d === 'object' && d.stack) { const { stack, ...rest } = d; return { ...rest, stack: '(stack trace present in response)' }; }
  return d;
}

async function healthy() {
  try { const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2000) }); return r.ok; } catch { return false; }
}
async function ensureServer() {
  if (await healthy()) return false;
  console.log('    !! server is DOWN after this request — restarting it');
  const child = spawn(process.execPath, ['src/server.js'], { cwd: process.cwd(), env: process.env, detached: true, stdio: 'ignore' });
  child.unref();
  for (let i = 0; i < 30; i += 1) { await new Promise((r) => setTimeout(r, 500)); if (await healthy()) return true; }
  throw new Error('could not restart the server');
}

// ───────────────────────── test-case recorder ─────────────────────────
// expect: { status, msg? , verify?(res)=>string|true , note }
async function tc(id, technique, title, input, expected, run, check) {
  currentCase = id;
  const res = await run();
  let pass = false;
  let actual;
  let why = '';
  if (res.error) {
    actual = `NO RESPONSE — ${res.error}`;
    pass = false;
  } else {
    const msg = res.data && res.data.message ? ` "${res.data.message}"` : '';
    actual = `HTTP ${res.status}${msg}`;
    const v = check(res);
    pass = v === true;
    if (v !== true) why = v;
    if (typeof v === 'string' && v.startsWith('~')) { pass = false; }
  }
  const restarted = await ensureServer();
  if (restarted) actual += ' — then the API process had CRASHED and had to be restarted';
  const row = { id, technique, title, input, expected, actual, status: pass ? 'PASS' : 'FAIL', why };
  results.push(row);
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id.padEnd(8)} ${title}\n        expected: ${expected}\n        actual  : ${actual}${why ? `\n        note    : ${why}` : ''}`);
  return res;
}
const is = (status, msgPart) => (res) => {
  if (res.status !== status) return `expected HTTP ${status}, got ${res.status}`;
  if (msgPart && !String(res.data?.message || '').includes(msgPart)) return `message did not contain "${msgPart}"`;
  return true;
};
const isOneOf = (statuses) => (res) => (statuses.includes(res.status) ? true : `expected HTTP ${statuses.join('/')} , got ${res.status}`);

// ───────────────────────── fixtures ─────────────────────────
const em = (tag) => `${tag}.${RUN}@qa.tutorhub.test`;
async function register(role, tag, password = 'secret123', extra = {}) {
  const r = await api('POST', '/auth/register', { body: { name: `QA ${tag}`, email: em(tag), password, role, ...extra } });
  return { ...r, token: r.data?.token, id: r.data?.user?.id, email: em(tag) };
}
async function createClass(token, body) {
  const r = await api('POST', '/classes', { token, body });
  return { ...r, id: r.data?.id };
}
async function enrolAndApprove(teacherToken, classId, student) {
  const e = await api('POST', `/classes/${classId}/enroll`, { token: student.token, body: {} });
  const a = await api('PATCH', `/classes/${classId}/enrollments/${e.data.id}`, { token: teacherToken, body: { status: 'approved' } });
  return { enrollmentId: e.data.id, approve: a };
}

// ───────────────────────── the run ─────────────────────────
console.log(`TutorHub black-box execution  |  API: ${BASE}  |  run id: ${RUN}  |  ${new Date().toISOString()}\n`);
if (!(await healthy())) { console.error('API is not reachable at', BASE); process.exit(2); }
const health = await api('GET', '/health');

// ---------- Equivalence Partitioning: registration ----------
console.log('=== Equivalence Partitioning ===');
currentCase = 'setup';
let T; let S1; let T2;
await tc('EP-02', 'EP', 'User.password length — 6+ chars (valid)', 'role=student, password "secret1" (7 chars)', '201, account created',
  async () => { S1 = await register('student', 'ep02', 'secret1', { grade: '11' }); return S1; }, is(201));
await tc('EP-03', 'EP', 'User.role — teacher (valid)', 'role=teacher', '201, account created as teacher',
  async () => { T = await register('teacher', 'ep03'); return T; }, (r) => (r.status === 201 && r.data.user.role === 'teacher' ? true : 'wrong status/role'));
await tc('EP-04', 'EP', 'User.role — student (valid)', 'role=student', '201, account created as student',
  async () => register('student', 'ep04'), (r) => (r.status === 201 && r.data.user.role === 'student' ? true : 'wrong status/role'));
T2 = await register('teacher', 'teacher2'); // second teacher (fixture only)
await tc('EP-05', 'EP', 'User.role — anything else (invalid)', 'role=admin', "400 'role must be teacher or student'",
  async () => api('POST', '/auth/register', { body: { name: 'x', email: em('ep05'), password: 'secret123', role: 'admin' } }), is(400, 'role must be teacher or student'));

// ---------- fixtures used by the rest ----------
const C1 = await createClass(T.token, { name: 'QA Class 1', grade: 'Grade 11', subjects: ['Pure Maths'], published: true }); // defaults on purpose
const C1draft = await createClass(T.token, { name: 'QA Draft class', published: false });
const sA = await register('student', 'sA'); const sB = await register('student', 'sB'); const sC = await register('student', 'sC');
const sD = await register('student', 'sD'); const sQ = await register('student', 'sQ'); const sP = await register('student', 'sP'); const sR = await register('student', 'sR');
const sX = await register('student', 'sX'); // never enrolled anywhere

// ---------- Decision table: Enrollment ----------
console.log('\n=== Decision Table — Enrollment ===');
await tc('DT-E1', 'DT', 'Unpublished class, no enrollment, student requests seat', 'published=No, enrollment=none, action=request', "404 'This class is not open for enrollment'",
  async () => api('POST', `/classes/${C1draft.id}/enroll`, { token: sA.token, body: {} }), is(404, 'not open for enrollment'));
let pEnr;
await tc('DT-E2', 'DT', 'Published class, no enrollment, student requests seat', 'published=Yes, enrollment=none, action=request', '201, new enrollment status=pending',
  async () => { pEnr = await api('POST', `/classes/${C1.id}/enroll`, { token: sP.token, body: {} }); return pEnr; }, (r) => (r.status === 201 && r.data.status === 'pending' ? true : 'expected 201/pending'));
await tc('DT-E3', 'DT', 'Pending enrollment, student requests again', 'published=Yes, enrollment=pending, action=request', "409 'Your request is already pending approval'",
  async () => api('POST', `/classes/${C1.id}/enroll`, { token: sP.token, body: {} }), is(409, 'already pending'));
await tc('EP-13', 'EP', 'Enrollment.status on respond — anything else (invalid)', "status='maybe' on sP's pending request", "400 'status must be approved or rejected'",
  async () => api('PATCH', `/classes/${C1.id}/enrollments/${pEnr.data.id}`, { token: T.token, body: { status: 'maybe' } }), is(400, 'status must be approved or rejected'));
await tc('DT-E8', 'DT', 'Teacher sends invalid status (decision rule 8)', "status='maybe'", "400 'status must be approved or rejected'",
  async () => api('PATCH', `/classes/${C1.id}/enrollments/${pEnr.data.id}`, { token: T.token, body: { status: 'maybe' } }), is(400, 'status must be approved or rejected'));
await tc('DT-E9', 'DT', 'Enrollment id not found in this class', 'enrollmentId=000000000000000000000000, status=approved', "404 'Enrollment request not found'",
  async () => api('PATCH', `/classes/${C1.id}/enrollments/000000000000000000000000`, { token: T.token, body: { status: 'approved' } }), is(404, 'Enrollment request not found'));

// approved flow
const aEnr = await api('POST', `/classes/${C1.id}/enroll`, { token: sA.token, body: {} });
await tc('EP-10', 'EP', 'Enrollment.status on respond — approved (valid)', "teacher approves sA's request", '200, enrollment approved',
  async () => api('PATCH', `/classes/${C1.id}/enrollments/${aEnr.data.id}`, { token: T.token, body: { status: 'approved' } }), (r) => (r.status === 200 && r.data.status === 'approved' ? true : 'expected 200/approved'));
await tc('DT-E4', 'DT', 'Approved enrollment, student requests again', 'published=Yes, enrollment=approved, action=request', "409 'You are already enrolled in this class'",
  async () => api('POST', `/classes/${C1.id}/enroll`, { token: sA.token, body: {} }), is(409, 'already enrolled'));
const rEnr = await api('POST', `/classes/${C1.id}/enroll`, { token: sR.token, body: {} });
await tc('EP-11', 'EP', 'Enrollment.status on respond — rejected (valid)', "teacher rejects sR's request", '200, enrollment rejected',
  async () => api('PATCH', `/classes/${C1.id}/enrollments/${rEnr.data.id}`, { token: T.token, body: { status: 'rejected' } }), (r) => (r.status === 200 && r.data.status === 'rejected' ? true : 'expected 200/rejected'));
await tc('DT-E5', 'DT', 'Rejected enrollment, student requests again', 'published=Yes, enrollment=rejected, action=request', '201, SAME record reused and reset to pending',
  async () => api('POST', `/classes/${C1.id}/enroll`, { token: sR.token, body: {} }), (r) => (r.status === 201 && r.data.status === 'pending' && r.data.id === rEnr.data.id ? true : 'expected 201 / pending / same enrollment id'));
await api('PATCH', `/classes/${C1.id}/enrollments/${rEnr.data.id}`, { token: T.token, body: { status: 'rejected' } }); // leave sR rejected
await tc('DT-E6', 'DT', 'Teacher approves a pending request (rule 6)', "approve sB's request", '200, status -> approved',
  async () => { const e = await api('POST', `/classes/${C1.id}/enroll`, { token: sB.token, body: {} }); return api('PATCH', `/classes/${C1.id}/enrollments/${e.data.id}`, { token: T.token, body: { status: 'approved' } }); }, (r) => (r.status === 200 && r.data.status === 'approved' ? true : 'expected 200/approved'));
await tc('DT-E7', 'DT', 'Teacher rejects a pending request (rule 7)', "reject sX's request", '200, status -> rejected',
  async () => { const e = await api('POST', `/classes/${C1.id}/enroll`, { token: sX.token, body: {} }); return api('PATCH', `/classes/${C1.id}/enrollments/${e.data.id}`, { token: T.token, body: { status: 'rejected' } }); }, (r) => (r.status === 200 && r.data.status === 'rejected' ? true : 'expected 200/rejected'));
await enrolAndApprove(T.token, C1.id, sC); await enrolAndApprove(T.token, C1.id, sD); await enrolAndApprove(T.token, C1.id, sQ);

// ---------- EP: Attendance + BVA rounding ----------
console.log('\n=== Equivalence Partitioning / BVA — Attendance ===');
const sessions = [];
for (let i = 0; i < 10; i += 1) {
  const d = new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10);
  const r = await api('POST', `/classes/${C1.id}/sessions`, { token: T.token, body: { date: d, topic: `Session ${i + 1}` } });
  sessions.push(r.data._id);
}
const mark = (student, sess, status) => api('POST', `/classes/${C1.id}/attendance`, { token: T.token, body: { sessionId: sess, studentId: student.id, status } });
await tc('EP-06', 'EP', 'Attendance.status — present (valid)', 'status=present', '200, record upserted', async () => mark(sA, sessions[0], 'present'), (r) => (r.status === 200 && r.data.status === 'present' ? true : 'expected 200/present'));
await tc('EP-07', 'EP', 'Attendance.status — late (valid)', 'status=late', '200, counted as present AND late in summary', async () => mark(sA, sessions[1], 'late'), (r) => (r.status === 200 && r.data.status === 'late' ? true : 'expected 200/late'));
await tc('EP-08', 'EP', 'Attendance.status — absent (valid)', 'status=absent', '200, record upserted', async () => mark(sA, sessions[2], 'absent'), (r) => (r.status === 200 && r.data.status === 'absent' ? true : 'expected 200/absent'));
await tc('EP-09', 'EP', 'Attendance.status — anything else (invalid)', "status='excused'", "400 'status must be present, late or absent'", async () => mark(sA, sessions[3], 'excused'), is(400, 'status must be present, late or absent'));
await tc('EP-07b', 'EP', 'Summary for sA = 1 present + 1 late + 1 absent', 'GET /attendance/me as sA', 'present=1, late=1, absent=1, pct=67',
  async () => api('GET', `/classes/${C1.id}/attendance/me`, { token: sA.token }), (r) => { const s = r.data?.summary; return s && s.present === 1 && s.late === 1 && s.absent === 1 && s.pct === 67 ? true : `summary was ${JSON.stringify(s)}`; });
for (let i = 0; i < 10; i += 1) await mark(sB, sessions[i], i < 8 ? 'present' : 'absent');
await tc('BVA-09', 'BVA', 'Attendance % — exact, no rounding', 'sB: 8 present of 10 sessions', 'pct = 80',
  async () => api('GET', `/classes/${C1.id}/attendance/me`, { token: sB.token }), (r) => (r.data?.summary?.pct === 80 ? true : `pct was ${r.data?.summary?.pct}`));
await mark(sC, sessions[0], 'present'); await mark(sC, sessions[1], 'late'); await mark(sC, sessions[2], 'absent');
await tc('BVA-10', 'BVA', 'Attendance % — rounds up', 'sC: 2 of 3 sessions present/late', 'pct = 67 (Math.round 66.66)',
  async () => api('GET', `/classes/${C1.id}/attendance/me`, { token: sC.token }), (r) => (r.data?.summary?.pct === 67 ? true : `pct was ${r.data?.summary?.pct}`));
await tc('BVA-11', 'BVA', 'Attendance % — zero records (edge)', 'sD: approved, no attendance marked', 'pct = 0, not NaN/Infinity',
  async () => api('GET', `/classes/${C1.id}/attendance/me`, { token: sD.token }), (r) => (r.data?.summary?.pct === 0 && r.data.summary.total === 0 ? true : `summary was ${JSON.stringify(r.data?.summary)}`));

// ---------- EP: Payments ----------
console.log('\n=== Equivalence Partitioning — Payments ===');
const month = '2026-11';
const gen = await api('POST', `/classes/${C1.id}/payments/generate`, { token: T.token, body: { month } });
const pays = (await api('GET', `/classes/${C1.id}/payments?month=${month}`, { token: T.token })).data;
const payId = pays[0]?._id;
await tc('EP-14', 'EP', 'Payment.status — paid (valid)', "status=paid", '200, paidAt stamped', async () => api('PATCH', `/classes/${C1.id}/payments/${payId}`, { token: T.token, body: { status: 'paid' } }), (r) => (r.status === 200 && r.data.paidAt ? true : 'expected 200 with paidAt set'));
await tc('EP-15', 'EP', 'Payment.status — due (valid)', "status=due", '200, paidAt cleared', async () => api('PATCH', `/classes/${C1.id}/payments/${payId}`, { token: T.token, body: { status: 'due' } }), (r) => (r.status === 200 && r.data.paidAt === null ? true : 'expected 200 with paidAt null'));
await tc('EP-16', 'EP', 'Payment.status — anything else (invalid)', "status='cancelled'", "400 'status must be paid, due or overdue'", async () => api('PATCH', `/classes/${C1.id}/payments/${payId}`, { token: T.token, body: { status: 'cancelled' } }), is(400, 'status must be paid, due or overdue'));
await tc('DT-P1', 'DT', 'Generate monthly fees twice — no duplicates', 'POST /payments/generate again for the same month', 'createdCount = 0',
  async () => api('POST', `/classes/${C1.id}/payments/generate`, { token: T.token, body: { month } }), (r) => (r.status === 201 && r.data.createdCount === 0 ? true : `createdCount was ${r.data?.createdCount} (first run created ${gen.data?.createdCount})`));

// ---------- Decision table: Quiz attempt + BVA question count ----------
console.log('\n=== Decision Table — Quiz attempt / BVA — question count ===');
const dueDate = '2026-12-31';
const q = (n, correct = 0) => Array.from({ length: n }, (_, i) => ({ text: `Q${i + 1}`, options: ['A', 'B', 'C', 'D'], correctIndex: correct }));
const Q4 = (await api('POST', `/classes/${C1.id}/quizzes`, { token: T.token, body: { title: 'Quiz 4q', subject: 'Pure Maths', dueDate, questions: q(4), published: true } })).data;
const Qdraft = (await api('POST', `/classes/${C1.id}/quizzes`, { token: T.token, body: { title: 'Draft quiz', subject: 'Pure Maths', dueDate, questions: q(2), published: false } })).data;
const Q0 = (await api('POST', `/classes/${C1.id}/quizzes`, { token: T.token, body: { title: 'Empty quiz', subject: 'Pure Maths', dueDate, questions: [], published: true } })).data;
const Q1q = (await api('POST', `/classes/${C1.id}/quizzes`, { token: T.token, body: { title: 'One question quiz', subject: 'Pure Maths', dueDate, questions: q(1), published: true } })).data;
const attempt = (student, quiz, answers) => api('POST', `/classes/${C1.id}/attempts`, { token: student.token, body: { quizId: quiz._id, answers } });
await tc('DT-Q1', 'DT', 'Quiz not published', 'published=No, attempted=No, approved=Yes', "404 'Quiz not found or not published'", async () => attempt(sQ, Qdraft, [0, 0]), is(404, 'not published'));
await tc('DT-Q3', 'DT', 'Valid first attempt is graded', 'published=Yes, attempted=No, approved=Yes; 4/4 correct', '201, score 100', async () => attempt(sQ, Q4, [0, 0, 0, 0]), (r) => (r.status === 201 && r.data.score === 100 ? true : `status ${r.status}, score ${r.data?.score}`));
await tc('DT-Q2', 'DT', 'Quiz already attempted', 'published=Yes, attempted=Yes, approved=Yes', "409 'You have already attempted this quiz'", async () => attempt(sQ, Q4, [0, 0, 0, 0]), is(409, 'already attempted'));
await tc('DT-Q4', 'DT', 'Student not approved in class (pending)', 'published=Yes, attempted=No, approved=No (sP is pending)', "403 'You are not enrolled in this class yet'", async () => attempt(sP, Q4, [0, 0, 0, 0]), is(403, 'not enrolled'));
await tc('BVA-07', 'BVA', 'Quiz with 0 questions (edge)', 'Q0 has 0 questions, answers=[]', 'score = 0, never NaN or a crash', async () => attempt(sD, Q0, []), (r) => (r.status === 201 && r.data.score === 0 && r.data.total === 0 ? true : `status ${r.status}, score ${r.data?.score}`));
await tc('BVA-08a', 'BVA', 'Quiz with 1 question — correct answer', '1 question, answer correct', 'score = 100', async () => attempt(sD, Q1q, [0]), (r) => (r.status === 201 && r.data.score === 100 ? true : `status ${r.status}, score ${r.data?.score}`));
await tc('BVA-08b', 'BVA', 'Quiz with 1 question — wrong answer', '1 question, answer wrong', 'score = 0', async () => attempt(sC, Q1q, [3]), (r) => (r.status === 201 && r.data.score === 0 ? true : `status ${r.status}, score ${r.data?.score}`));
await tc('EP-18', 'EP', 'answers[] shorter than questions[] (tolerated)', '2 correct answers for a 4-question quiz', 'score = 50, unanswered count as wrong, no crash', async () => attempt(sB, Q4, [0, 0]), (r) => (r.status === 201 && r.data.score === 50 ? true : `status ${r.status}, score ${r.data?.score}`));

// ---------- BVA: password length + class defaults + seats ----------
console.log('\n=== Boundary Value Analysis ===');
await tc('BVA-02', 'BVA', 'Password = 6 chars (AT the minimum)', '"abc123"', '201 — the boundary itself must pass', async () => register('student', 'bva02', 'abc123'), is(201));
await tc('BVA-03', 'BVA', 'Password = 7 chars (above the minimum)', '"abc1234"', '201', async () => register('student', 'bva03', 'abc1234'), is(201));
const Cdef = await tc('BVA-12', 'BVA', 'Defaults when fee & maxStudents omitted', 'POST /classes with only {name}', 'monthlyFee = 3000, maxStudents = 15',
  async () => createClass(T.token, { name: 'QA defaults' }), (r) => (r.status === 201 && r.data.monthlyFee === 3000 && r.data.maxStudents === 15 ? true : `fee ${r.data?.monthlyFee}, max ${r.data?.maxStudents}`));
await tc('BVA-13', 'BVA', '[exploratory] maxStudents = 1 (lowest sensible value)', 'maxStudents=1', '201, saved as 1', async () => createClass(T.token, { name: 'QA one seat', maxStudents: 1 }), (r) => (r.status === 201 && r.data.maxStudents === 1 ? true : `saved ${r.data?.maxStudents}`));
await tc('BVA-14', 'BVA', '[exploratory] maxStudents = -1 (below valid range)', 'maxStudents=-1', '400 — a negative capacity must be rejected', async () => createClass(T.token, { name: 'QA negative seats', maxStudents: -1 }), is(400));
await tc('BVA-15', 'BVA', '[exploratory] monthlyFee = -500 (below valid range)', 'monthlyFee=-500', '400 — a negative fee must be rejected', async () => createClass(T.token, { name: 'QA negative fee', monthlyFee: -500 }), is(400));

// seats: 2-seat class (the Defect Issue-1 reproduction) and the 15-seat boundary
const C2 = await createClass(T.token, { name: 'QA two-seat class', maxStudents: 2, published: true });
const seatStudents = [];
for (let i = 0; i < 3; i += 1) seatStudents.push(await register('student', `seat2_${i}`));
const e2 = [];
for (const s of seatStudents) e2.push((await api('POST', `/classes/${C2.id}/enroll`, { token: s.token, body: {} })).data.id);
await api('PATCH', `/classes/${C2.id}/enrollments/${e2[0]}`, { token: T.token, body: { status: 'approved' } });
await tc('EP-17', 'EP', 'Seats: approvedCount < maxStudents (valid)', '2-seat class, approving the 2nd student', '200 approved', async () => api('PATCH', `/classes/${C2.id}/enrollments/${e2[1]}`, { token: T.token, body: { status: 'approved' } }), is(200));
await tc('EP-19', 'EP', 'Seats: approvedCount >= maxStudents (invalid)  [Issue-1]', '2-seat class already holds 2 approved students; approve a 3rd', "409 'class is already full'", async () => api('PATCH', `/classes/${C2.id}/enrollments/${e2[2]}`, { token: T.token, body: { status: 'approved' } }), is(409));

const C3 = await createClass(T.token, { name: 'QA fifteen-seat class', published: true }); // default maxStudents = 15
const many = [];
for (let i = 0; i < 16; i += 1) many.push(await register('student', `seat15_${i}`));
const e3 = [];
for (const s of many) e3.push((await api('POST', `/classes/${C3.id}/enroll`, { token: s.token, body: {} })).data.id);
for (let i = 0; i < 13; i += 1) await api('PATCH', `/classes/${C3.id}/enrollments/${e3[i]}`, { token: T.token, body: { status: 'approved' } });
await tc('BVA-04', 'BVA', 'Seat boundary: 14th approved (one below max)', '13 approved, approve the 14th', '200 approved', async () => api('PATCH', `/classes/${C3.id}/enrollments/${e3[13]}`, { token: T.token, body: { status: 'approved' } }), is(200));
await tc('BVA-04b', 'BVA', 'Seat boundary: 15th approved (the LAST valid seat)', '14 approved, approve the 15th', '200 approved — last valid seat', async () => api('PATCH', `/classes/${C3.id}/enrollments/${e3[14]}`, { token: T.token, body: { status: 'approved' } }), is(200));
await tc('BVA-05', 'BVA', 'Seat boundary: 16th approved (ABOVE max)  [Issue-1]', '15 of 15 approved, approve a 16th', "409 'class is already full'", async () => api('PATCH', `/classes/${C3.id}/enrollments/${e3[15]}`, { token: T.token, body: { status: 'approved' } }), is(409));
const mine = (await api('GET', '/classes/mine', { token: T.token })).data.find((c) => c.id === C3.id);
console.log(`        (observed: class "${mine.name}" has ${mine.approvedCount} approved students against maxStudents=${mine.maxStudents})`);

// ---------- Decision table: access control (role x ownership x enrolment) ----------
console.log('\n=== Decision Table — Access control & authentication ===');
await tc('DT-A1', 'DT', 'No token', 'GET /classes/mine without Authorization', "401 'no token'", async () => api('GET', '/classes/mine'), is(401, 'no token'));
await tc('DT-A2', 'DT', 'Tampered token', 'valid JWT with its last chars altered', "401 'token failed'", async () => api('GET', '/classes/mine', { token: T.token.slice(0, -4) + 'AAAA' }), is(401, 'token failed'));
await tc('DT-A3', 'DT', 'Student calls a teacher-only endpoint', 'student POST /classes', "403 'insufficient role'", async () => createClass(sA.token, { name: 'hacked class' }), is(403, 'insufficient role'));
await tc('DT-A4', 'DT', "Teacher edits another teacher's class", "teacher 2 PATCH teacher 1's class", "403 'You do not own this class'", async () => api('PATCH', `/classes/${C1.id}`, { token: T2.token, body: { name: 'stolen' } }), is(403, 'do not own'));
await tc('DT-A5', 'DT', 'Student with no approved seat reads class quizzes', 'sX (rejected) GET /quizzes', "403 'not enrolled in this class yet'", async () => api('GET', `/classes/${C1.id}/quizzes`, { token: sX.token }), is(403, 'not enrolled'));
await tc('DT-A6', 'DT', 'Student reads quizzes — answers hidden', 'approved student GET /quizzes', 'correctIndex NOT present in the payload',
  async () => api('GET', `/classes/${C1.id}/quizzes`, { token: sA.token }), (r) => (r.status === 200 && !JSON.stringify(r.data).includes('correctIndex') ? true : 'answer key leaked to student'));
await tc('DT-A7', 'DT', 'Login — wrong password', 'correct e-mail, wrong password', "401 'Invalid email or password'", async () => api('POST', '/auth/login', { body: { email: em('ep03'), password: 'wrongpass' } }), is(401, 'Invalid email or password'));
await tc('DT-A8', 'DT', 'Login — correct credentials', 'correct e-mail + password', '200 + JWT', async () => api('POST', '/auth/login', { body: { email: em('ep03'), password: 'secret123', role: 'teacher' } }), (r) => (r.status === 200 && r.data.token ? true : 'no token'));
await tc('DT-A9', 'DT', 'Login — right credentials, wrong role', 'teacher account, role=student', '401 not registered as a student', async () => api('POST', '/auth/login', { body: { email: em('ep03'), password: 'secret123', role: 'student' } }), is(401, 'not registered as a student'));
await tc('DT-A10', 'DT', 'Register — duplicate e-mail', 'register ep03 e-mail again', "409 'account already exists'", async () => register('teacher', 'ep03'), is(409, 'already exists'));
await tc('DT-A11', 'DT', 'Register — missing required field', 'no role', "400 'required'", async () => api('POST', '/auth/register', { body: { name: 'n', email: em('nr'), password: 'secret123' } }), is(400, 'required'));
await tc('DT-A12', 'DT', 'Response never exposes the password hash', 'GET /auth/me', 'no "password" field', async () => api('GET', '/auth/me', { token: T.token }), (r) => (r.status === 200 && !('password' in (r.data.user || {})) ? true : 'password field present'));

// ---------- last: inputs that make the API throw (async errors in Express 4) ----------
console.log('\n=== Invalid-input cases that reach the database layer ===');
await tc('EP-01', 'EP', 'User.password length — too short (invalid)', 'role=student, password "pq1" (3 chars)', 'Rejected with a clean 4xx validation error',
  async () => api('POST', '/auth/register', { body: { name: 'short', email: em('ep01'), password: 'pq1', role: 'student' }, timeoutMs: 5000 }), isOneOf([400, 422]));
await tc('BVA-01', 'BVA', 'Password = 5 chars (just BELOW the minimum)', '"abc12"', 'Rejected with a clean 4xx validation error',
  async () => api('POST', '/auth/register', { body: { name: 'short', email: em('bva01'), password: 'abc12', role: 'student' }, timeoutMs: 5000 }), isOneOf([400, 422]));
await tc('DT-X1', 'DT', '[exploratory] Malformed class id in URL', 'GET /classes/not-an-id', 'Clean 4xx (400/404), API stays up',
  async () => api('GET', '/classes/not-an-id', { token: T.token, timeoutMs: 5000 }), isOneOf([400, 404]));
await tc('DT-X2', 'DT', '[exploratory] Malformed enrollment id', 'PATCH /enrollments/zzz', 'Clean 4xx (400/404), API stays up',
  async () => api('PATCH', `/classes/${C1.id}/enrollments/zzz`, { token: T.token, body: { status: 'approved' }, timeoutMs: 5000 }), isOneOf([400, 404]));

// ───────────────────────── write evidence ─────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });
const passN = results.filter((r) => r.status === 'PASS').length;
const failN = results.length - passN;
const summary = { generatedAt: new Date().toISOString(), api: BASE, runId: RUN, total: results.length, passed: passN, failed: failN, health: health.data };
fs.writeFileSync(path.join(OUT_DIR, 'execution-results.json'), JSON.stringify({ summary, results }, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'http-transcript.json'), JSON.stringify(transcript, null, 2));
console.log(`\n==== SUMMARY: ${results.length} cases — ${passN} passed, ${failN} failed ====`);
for (const r of results.filter((x) => x.status === 'FAIL')) console.log(`  FAIL ${r.id}: ${r.title} -> ${r.actual}`);
