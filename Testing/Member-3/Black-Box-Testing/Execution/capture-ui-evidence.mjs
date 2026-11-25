// Captures black-box UI evidence screenshots from the REAL running TutorHub frontend.
// Needs: API on :5000 + seeded DB (npm run seed), frontend on :5173, and playwright-core
//   (npm i playwright-core somewhere; point PW_DIR at that folder) + Microsoft Edge.
// Usage: PW_DIR=<folder with node_modules/playwright-core> node capture-ui-evidence.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(path.join(process.env.PW_DIR, 'x.js'));
const { chromium } = require('playwright-core');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'Evidence', 'Screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const UI = process.env.UI || 'http://127.0.0.1:5173';
const API = process.env.API || 'http://localhost:5000/api';
const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const RUN = Date.now().toString(36);

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } });
const page = await ctx.newPage();
const log = [];
const shot = async (name, note) => { await page.waitForTimeout(500); await page.screenshot({ path: path.join(SHOTS, name), fullPage: true }); log.push(`${name} — ${note}`); console.log('saved', name); };
const j = async (method, url, token, body) => (await fetch(API + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })).json();

async function login(role, email, password) {
  await page.goto(`${UI}/login`);
  await page.getByRole('button', { name: role, exact: true }).click();
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
}
async function logout() { await page.evaluate(() => localStorage.clear()); }

// BB-UI-01  Login page renders
await page.goto(`${UI}/login`);
await shot('BB-UI-01_login_page.png', 'Login page (student/teacher toggle, e-mail, password)');

// BB-UI-02  DT-A7: wrong password -> error message shown in the UI
await login('student', 'student@tutorhub.lk', 'wrong-password');
await page.getByText('Invalid email or password').waitFor();
await shot('BB-UI-02_login_wrong_password_error.png', 'DT-A7: wrong password -> "Invalid email or password"');

// BB-UI-03  DT-A9: right credentials, wrong role
await page.goto(`${UI}/login`);
await login('teacher', 'student@tutorhub.lk', 'student123');
await page.getByText('not registered as a teacher').waitFor();
await shot('BB-UI-03_login_wrong_role_error.png', 'DT-A9: student credentials on teacher tab -> "not registered as a teacher"');

// BB-UI-04  EP-04/BVA-02: register a new student at the 6-char password boundary through the UI
await page.goto(`${UI}/login`);
await page.getByRole('button', { name: 'Sign up' }).click();
await page.getByPlaceholder('Nimal Perera').fill('QA Boundary Student');
await page.getByPlaceholder('you@example.com').fill(`bva.ui.${RUN}@qa.tutorhub.test`);
await page.locator('input[type=password]').fill('abc123');
await page.locator('select[name=grade]').selectOption('11');
await shot('BB-UI-04a_register_6char_password_form.png', 'BVA-02: registration form with a 6-character password (the minimum)');
await page.getByRole('button', { name: 'Create account' }).click();
await page.waitForURL('**/dashboard');
await shot('BB-UI-04b_register_6char_password_success.png', 'BVA-02: account accepted -> student dashboard');
await logout();

// BB-UI-05  Teacher: DT-A / EP — create a class via the UI (defaults shown)
await login('teacher', 'teacher@tutorhub.lk', 'teacher123');
await page.waitForURL('**/admin');
await shot('BB-UI-05a_teacher_dashboard.png', 'Teacher "My classes" after login (seeded data)');
await page.getByRole('button', { name: /Create a class/ }).click();
await page.getByPlaceholder(/Class name/).fill('QA Capacity Demo');
await page.getByPlaceholder(/Grade \(e.g/).fill('Grade 11');
await page.getByPlaceholder(/Subjects, comma/).fill('Pure Maths');
await page.getByPlaceholder('Max students').fill('1');
await shot('BB-UI-05b_create_class_form_max1.png', 'Create-class form filled, maxStudents = 1 (lowest sensible boundary)');
await page.getByRole('button', { name: 'Create class', exact: true }).click();
await page.getByText('QA Capacity Demo').first().waitFor();
await shot('BB-UI-05c_class_created.png', 'New class "QA Capacity Demo" appears in the teacher list');

// BB-UI-06  Issue-1 in the UI: two students request a 1-seat class and the teacher approves BOTH
const tTok = (await j('POST', '/auth/login', null, { email: 'teacher@tutorhub.lk', password: 'teacher123' })).token;
const cls = (await j('GET', '/classes/mine', tTok)).find((c) => c.name === 'QA Capacity Demo');
for (const who of ['ayesha', 'kavindu']) {
  const sTok = (await j('POST', '/auth/login', null, { email: `${who}@tutorhub.lk`, password: 'password123' })).token;
  await j('POST', `/classes/${cls.id}/enroll`, sTok, {});
}
await page.goto(`${UI}/admin/classes/${cls.id}`);
await page.getByRole('button', { name: /^Requests/ }).click();
await page.getByText('Ayesha Fernando').waitFor();
await shot('BB-UI-06a_two_pending_requests_for_1_seat_class.png', 'Issue-1: two pending requests against a class with maxStudents = 1');
await page.getByRole('button', { name: /Approve/ }).first().click();
await page.getByText('No pending requests right now.').waitFor({ timeout: 1500 }).catch(() => {});
await page.getByRole('button', { name: /Approve/ }).first().click();
await page.getByText('No pending requests right now.').waitFor();
await shot('BB-UI-06b_issue1_both_approved_beyond_capacity.png', 'Issue-1 DEFECT: both students approved although the class allows 1 seat — no "class is full" refusal');
await page.getByRole('button', { name: 'Overview', exact: true }).click();
await shot('BB-UI-06c_observation_stale_enrolled_counter.png', 'OBSERVATION: right after two approvals the "Enrolled students" tile still shows the old value (header stats only load once)');
await page.goto(`${UI}/admin/classes/${cls.id}`);
await page.getByText('Enrolled students').waitFor();
await page.waitForTimeout(800);
await shot('BB-UI-06d_issue1_enrolled_2_on_1_seat_class.png', 'Issue-1 DEFECT: after reload "Enrolled students" = 2 on a class created with maxStudents = 1');
await page.goto(`${UI}/admin`);
await page.getByText('QA Capacity Demo').first().waitFor();
await shot('BB-UI-06e_issue1_class_list_2_students.png', 'Issue-1 DEFECT: class list shows "2 students" for the 1-seat class');

// BB-UI-07  Teacher marks attendance on the seeded class (EP: present / late / absent)
const seeded = (await j('GET', '/classes/mine', tTok)).find((c) => c.name === 'Grade 11 - Combined Maths');
await page.goto(`${UI}/admin/classes/${seeded.id}`);
await page.getByRole('button', { name: 'Attendance', exact: true }).click();
await page.getByText('Mark attendance').first().waitFor();
await page.waitForTimeout(800);
await page.getByRole('button', { name: 'late' }).first().click();
await shot('BB-UI-07_attendance_marked_late.png', 'EP-07: attendance status "late" accepted for the first student');

// BB-UI-08  Role-based access: logged in as teacher, student URL is redirected
await page.goto(`${UI}/dashboard`);
await page.waitForTimeout(800);
await shot('BB-UI-08_teacher_blocked_from_student_panel.png', 'DT-A3 (UI): teacher opening /dashboard is redirected away from the student panel');
await logout();

// BB-UI-09  Student full flow: browse -> request -> pending badge
await login('student', 'student@tutorhub.lk', 'student123');
await page.waitForURL('**/dashboard');
await shot('BB-UI-09a_student_my_classes.png', 'Student "My classes": approved (A), pending (B), rejected states');
await page.goto(`${UI}/dashboard/browse`);
await page.getByText('Browse classes').first().waitFor();
await shot('BB-UI-09b_student_browse_classes.png', 'DT-E2/E3/E5: browse list — pending, approved, "ask again" states');

// BB-UI-10  Student class dashboard: attendance %, quizzes, progress chart (BVA attendance 92%)
const sTokNimal = (await j('POST', '/auth/login', null, { email: 'student@tutorhub.lk', password: 'student123' })).token;
const enrolled = (await j('GET', '/classes/enrolled', sTokNimal)).find((c) => c.enrollmentStatus === 'approved');
await page.goto(`${UI}/dashboard/classes/${enrolled.id}`);
await page.getByText('Subject progress').waitFor();
await page.waitForTimeout(1200);
await shot('BB-UI-10_student_class_dashboard_progress_chart.png', 'Student class dashboard: attendance ring, quizzes, payments, progress chart');

// BB-UI-11  Student blocked from teacher panel
await page.goto(`${UI}/admin`);
await page.waitForTimeout(800);
await shot('BB-UI-11_student_blocked_from_teacher_panel.png', 'DT-A3 (UI): student opening /admin is redirected away from the teacher panel');

// BB-UI-12  Pending student sees no class content (DT-Q4/DT-A5)
const pendingCls = (await j('GET', '/classes/enrolled', sTokNimal)).find((c) => c.enrollmentStatus === 'pending');
await page.goto(`${UI}/dashboard/classes/${pendingCls.id}`);
await page.waitForTimeout(1200);
await shot('BB-UI-12_pending_student_cannot_open_class.png', 'DT-A5/DT-Q4 (UI): pending student gets "You are not enrolled in this class yet"');

// BB-UI-13  DT-X1: malformed class id typed into the URL by an approved student
await page.goto(`${UI}/dashboard/classes/not-an-id`);
await page.waitForTimeout(1500);
await shot('BB-UI-13_malformed_class_id_raw_error.png', 'DT-X1: /dashboard/classes/not-an-id -> raw Mongoose "Cast to ObjectId failed" text shown to the user (HTTP 500)');

fs.writeFileSync(path.join(SHOTS, 'screenshot-index.txt'), log.join('\n') + '\n');
await browser.close();
console.log('\nDone —', log.length, 'screenshots');
