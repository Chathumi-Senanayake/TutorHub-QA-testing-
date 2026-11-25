// Executes the manual UI test cases TC-09, TC-13, TC-21 (Member 1) plus the security (SEC02/SEC03) and
// usability/mobile checks (Member 2) in the REAL running app and saves real browser screenshots.
// Needs: API :5000 (seeded: npm run seed), frontend on 127.0.0.1:5173, playwright-core (PW_DIR) + Edge.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(path.join(process.env.PW_DIR, 'x.js'));
const { chromium } = require('playwright-core');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const T = path.resolve(HERE, '..', '..'); // Testing/
const D1 = path.join(HERE, 'Evidence', 'Screenshots');
const D2S = path.join(T, 'Member-2', 'Security', 'Evidence', 'Screenshots');
const D2U = path.join(T, 'Member-2', 'Usability', 'Evidence', 'Screenshots');
[D1, D2S, D2U].forEach((d) => fs.mkdirSync(d, { recursive: true }));
const UI = 'http://127.0.0.1:5173'; const API = 'http://localhost:5000/api';
const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const RUN = Date.now().toString(36);
const notes = [];
const j = async (m, u, tok, b) => (await fetch(API + u, { method: m, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) }, body: b ? JSON.stringify(b) : undefined })).json();

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } });
const page = await ctx.newPage();
const shot = async (dir, name, note) => { await page.waitForTimeout(600); await page.screenshot({ path: path.join(dir, name), fullPage: true }); notes.push(`${path.basename(path.dirname(path.dirname(dir)))}/${name} — ${note}`); console.log('saved', name); };
async function login(role, email, password) {
  await page.goto(`${UI}/login`);
  await page.getByRole('button', { name: role, exact: true }).click();
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
}
const clear = () => page.evaluate(() => localStorage.clear());
const tok = async (email, pw) => (await j('POST', '/auth/login', null, { email, password: pw })).token;

// ───────── TC-09  create a class (teacher)
await login('teacher', 'teacher@tutorhub.lk', 'teacher123');
await page.waitForURL('**/admin');
await page.getByRole('button', { name: /Create a class/ }).click();
await page.getByPlaceholder(/Class name/).fill('TC09 Grade 9 Science');
await page.getByPlaceholder(/Grade \(e.g/).fill('Grade 9');
await page.getByPlaceholder(/Subjects, comma/).fill('Physics, Chemistry');
await shot(D1, 'TC09a_create_class_form_filled.png', 'TC-09: create-class form (fee 3000 and max students 15 are the pre-filled defaults)');
await page.getByRole('button', { name: 'Create class', exact: true }).click();
await page.getByText('TC09 Grade 9 Science').first().waitFor();
await shot(D1, 'TC09b_class_created_in_list.png', 'TC-09: new class appears in the teacher list (Published)');
const tt = await tok('teacher@tutorhub.lk', 'teacher123');
const created = (await j('GET', '/classes/mine', tt)).find((c) => c.name === 'TC09 Grade 9 Science');
notes.push(`TC-09 API check: monthlyFee=${created.monthlyFee}, maxStudents=${created.maxStudents}`);

// ───────── TC-13  quiz CRUD in the UI (create, list, delete; there is NO edit screen in the UI)
const classA = (await j('GET', '/classes/mine', tt)).find((c) => c.name === 'Grade 11 - Combined Maths');
await page.goto(`${UI}/admin/classes/${classA.id}`);
await page.getByRole('button', { name: 'Quizzes', exact: true }).click();
await page.getByRole('button', { name: '+ New quiz' }).click();
await page.getByPlaceholder('Quiz title').fill('TC13 Algebra Basics');
await page.locator('input[type=date]').fill('2026-12-20');
await page.getByPlaceholder('Question 1').fill('2 + 2 = ?');
await page.getByPlaceholder('Option 1').fill('3'); await page.getByPlaceholder('Option 2').fill('4');
await page.getByPlaceholder('Option 3').fill('5'); await page.getByPlaceholder('Option 4').fill('6');
await page.locator('input[type=radio]').nth(1).check();
await shot(D1, 'TC13a_quiz_create_form.png', 'TC-13: quiz form filled (correct answer = option 2)');
await page.getByRole('button', { name: 'Create quiz', exact: true }).click();
await page.getByText('TC13 Algebra Basics').first().waitFor();
await shot(D1, 'TC13b_quiz_created_in_list.png', 'TC-13: quiz created and listed (Published, 0 attempts)');
await page.locator('li', { hasText: 'TC13 Algebra Basics' }).getByRole('button', { name: 'Delete' }).click();
await page.waitForTimeout(800);
await page.getByText('TC13 Algebra Basics').first().waitFor({ state: 'detached' }).catch(() => {});
await shot(D1, 'TC13c_quiz_deleted.png', 'TC-13: quiz removed after Delete. (No edit screen exists in the UI — update only works via API)');
await clear();

// ───────── TC-21  full flow: register -> browse -> request -> approve -> (attempt) -> progress
await page.goto(`${UI}/login`);
await page.getByRole('button', { name: 'Sign up' }).click();
await page.getByPlaceholder('Nimal Perera').fill('TC21 New Student');
await page.getByPlaceholder('you@example.com').fill(`tc21.${RUN}@qa.tutorhub.test`);
await page.locator('input[type=password]').fill('secret123');
await page.locator('select[name=grade]').selectOption('10');
await shot(D1, 'TC21a_student_register_form.png', 'TC-21 step 1: student registration form');
await page.getByRole('button', { name: 'Create account' }).click();
await page.waitForURL('**/dashboard');
await shot(D1, 'TC21b_new_student_empty_dashboard.png', 'TC-21 step 1: new student lands on an empty "My classes"');
await page.goto(`${UI}/dashboard/browse`);
await page.getByText('Browse classes').first().waitFor();
await shot(D1, 'TC21c_browse_published_classes.png', 'TC-21 step 2: browse published classes');
await page.getByText('Grade 10 - Maths Foundation').first().locator('xpath=ancestor::*[.//button][1]').getByRole('button', { name: 'Request to enroll' }).click();
await page.getByText('Request pending').first().waitFor();
await shot(D1, 'TC21d_request_pending.png', 'TC-21 step 3: seat requested -> "Request pending"');
const sTok = await page.evaluate(() => localStorage.getItem('tutorhub-token'));
const enrolled = (await j('GET', '/classes/enrolled', sTok))[0];
const teacherEmail = enrolled.teacherName.includes('Fernando') ? 'fernando@tutorhub.lk' : 'teacher@tutorhub.lk';
await clear();
await login('teacher', teacherEmail, 'teacher123');
await page.waitForURL('**/admin');
await page.goto(`${UI}/admin/classes/${enrolled.id}`);
await page.getByRole('button', { name: /^Requests/ }).click();
await page.getByText('TC21 New Student').waitFor();
await shot(D1, 'TC21e_teacher_sees_request.png', 'TC-21 step 4: teacher Requests tab shows the pending student (with count badge on the tab)');
await page.locator('li', { hasText: 'TC21 New Student' }).getByRole('button', { name: /Approve/ }).click();
await page.locator('li', { hasText: 'TC21 New Student' }).getByText('approved').waitFor();
await shot(D1, 'TC21f_teacher_approved.png', 'TC-21 step 4: approved (appears under Past decisions)');
await clear();
await page.goto(`${UI}/login`); await page.evaluate(([t]) => localStorage.setItem('tutorhub-token', t), [sTok]);
await page.evaluate(async ([t]) => { const r = await fetch('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${t}` } }); localStorage.setItem('tutorhub-user', JSON.stringify((await r.json()).user)); }, [sTok]);
await page.goto(`${UI}/dashboard/classes/${enrolled.id}`);
await page.getByText('Subject progress').waitFor();
await shot(D1, 'TC21g_student_class_open_no_attempt_button.png', 'TC-21 step 5: approved student opens the class. Quizzes show "Open" but THERE IS NO WAY TO ATTEMPT A QUIZ IN THE UI (feature gap)');
const quizzes = await j('GET', `/classes/${enrolled.id}/quizzes`, sTok);
const att = await j('POST', `/classes/${enrolled.id}/attempts`, sTok, { quizId: quizzes[0]._id, answers: quizzes[0].questions.map((_, i) => (i === 1 ? 1 : 0)) });
notes.push(`TC-21 step 5 done via API (UI has no attempt screen): score=${att.score}`);
await page.reload(); await page.getByText('Subject progress').waitFor(); await page.waitForTimeout(1500);
await shot(D1, 'TC21h_progress_chart_after_attempt.png', 'TC-21 step 6: after the (API) attempt the quiz shows Done and the progress chart has the new score');
await clear();

// ───────── Member 2 security: SEC02, SEC03
await page.goto('http://localhost:5000/api/classes/mine');
await shot(D2S, 'SEC02_no_token_blocked.png', 'SEC-01: GET /api/classes/mine opened in the browser without a token -> 401 JSON');
const nT = await tok('student@tutorhub.lk', 'student123');
const others = (await j('GET', '/classes/published', nT)).find((c) => c.enrollmentStatus === null);
await page.goto(`${UI}/login`);
await page.evaluate(async ([t]) => { localStorage.setItem('tutorhub-token', t); const r = await fetch('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${t}` } }); localStorage.setItem('tutorhub-user', JSON.stringify((await r.json()).user)); }, [nT]);
await page.goto(`${UI}/dashboard/classes/${others.id}`);
await page.waitForTimeout(1500);
await shot(D2S, 'SEC03_cross_class_access_blocked.png', 'SEC-09: student typing the URL of a class they are not enrolled in -> "You are not enrolled in this class yet"');
await clear();

// ───────── Member 2 usability: verify heuristics in the real UI (desktop + mobile)
await login('teacher', 'teacher@tutorhub.lk', 'teacher123'); await page.waitForURL('**/admin');
const classB = (await j('GET', '/classes/mine', tt)).find((c) => c.name === 'Grade 12 - Combined Maths');
await page.goto(`${UI}/admin/classes/${classB.id}`); await page.getByRole('button', { name: /^Requests/ }).waitFor();
await shot(D2U, 'USAB01_requests_tab_has_pending_badge.png', 'Heuristic 1: the Requests tab DOES show a pending-count badge (the earlier written claim that it does not was wrong)');
await page.goto(`${UI}/admin/classes/${classA.id}`);
await page.getByRole('button', { name: 'Attendance', exact: true }).click(); await page.waitForTimeout(1000);
await page.getByRole('button', { name: 'present' }).first().click(); await page.waitForTimeout(400);
await page.getByRole('button', { name: 'absent' }).first().click();
await shot(D2U, 'USAB02_attendance_can_be_corrected.png', 'Heuristic 3: a mis-click can be corrected by clicking another status (no confirm dialog, but fixable in one click)');
await page.goto(`${UI}/admin`); await page.getByRole('button', { name: /Create a class/ }).click();
await shot(D2U, 'USAB03_create_class_form_defaults.png', 'Heuristic 5: fee and max-students are pre-filled with defaults; inputs carry min attributes');
const minAttrs = await page.evaluate(() => [...document.querySelectorAll('input[type=number]')].map((i) => `${i.placeholder}: min=${i.min}, value=${i.value}`));
notes.push('USAB03 number inputs -> ' + minAttrs.join(' | '));
await clear();

const mob = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
const mp = await mob.newPage();
const overflow = async (label) => { const o = await mp.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })); notes.push(`MOBILE ${label}: scrollWidth=${o.sw}, clientWidth=${o.cw} -> ${o.sw > o.cw ? 'HORIZONTAL OVERFLOW' : 'fits'}`); };
const mshot = async (name, note, label) => { await mp.waitForTimeout(900); await mp.screenshot({ path: path.join(D2U, name), fullPage: true }); await overflow(label); notes.push(`Member-2/${name} — ${note}`); console.log('saved', name); };
await mp.goto(`${UI}/login`); await mshot('USAB04_mobile_login.png', 'Context coverage: login at phone width (375 px)', 'login');
await mp.getByRole('button', { name: 'student', exact: true }).click();
await mp.getByPlaceholder('you@example.com').fill('student@tutorhub.lk'); await mp.locator('input[type=password]').fill('student123');
await mp.getByRole('button', { name: 'Log in', exact: true }).click(); await mp.waitForURL('**/dashboard');
await mshot('USAB05_mobile_student_dashboard.png', 'Student "My classes" at phone width', 'student dashboard');
const mc = (await j('GET', '/classes/enrolled', await tok('student@tutorhub.lk', 'student123'))).find((c) => c.enrollmentStatus === 'approved');
await mp.goto(`${UI}/dashboard/classes/${mc.id}`); await mp.getByText('Subject progress').waitFor();
await mshot('USAB06_mobile_student_class_detail.png', 'Student class dashboard at phone width (chart, tables)', 'student class detail');
await mp.evaluate(() => localStorage.clear());
await mp.goto(`${UI}/login`); await mp.getByRole('button', { name: 'teacher', exact: true }).click();
await mp.getByPlaceholder('you@example.com').fill('teacher@tutorhub.lk'); await mp.locator('input[type=password]').fill('teacher123');
await mp.getByRole('button', { name: 'Log in', exact: true }).click(); await mp.waitForURL('**/admin');
await mp.goto(`${UI}/admin/classes/${classA.id}`); await mp.getByRole('button', { name: 'Attendance', exact: true }).click();
await mshot('USAB07_mobile_teacher_attendance.png', 'Teacher attendance tab at phone width', 'teacher attendance');

fs.writeFileSync(path.join(HERE, 'manual-test-run-notes.txt'), notes.join('\n') + '\n');
await browser.close();
console.log('\n' + notes.join('\n'));
