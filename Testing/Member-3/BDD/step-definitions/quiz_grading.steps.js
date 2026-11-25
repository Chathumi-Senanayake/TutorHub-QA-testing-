import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import esmock from 'esmock';

// These steps call the REAL submitAttempt() from src/controllers/attemptController.js
// (via esmock, which swaps out its two Mongoose model imports for in-memory fakes -
// no real database involved, same spirit as the mocked unit tests).

function fakeRes() {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

Given('a published quiz {string} with {int} questions', async function (title, count) {
  this.quiz = {
    _id: 'quiz-' + title.replace(/\s+/g, '-'),
    classGroup: 'c1',
    published: true,
    questions: Array.from({ length: count }, (_, i) => ({ text: `Q${i + 1}`, options: ['a', 'b'], correctIndex: i % 2 })),
  };
  this.attempts = []; // in-memory "Attempt" collection for this scenario
});

Given('the student has already attempted {string}', function (title) {
  this.attempts.push({ quiz: this.quiz._id, student: 's1' });
});

async function loadController(world) {
  return esmock('../../../src/controllers/attemptController.js', {
    '../../../src/models/Quiz.js': { default: { findOne: async () => world.quiz } },
    '../../../src/models/Attempt.js': {
      default: {
        findOne: async ({ quiz, student }) => world.attempts.find((a) => a.quiz === quiz && a.student === student) || null,
        create: async (doc) => { world.attempts.push(doc); return doc; },
      },
    },
  });
}

When('the student submits answers that match every correct option', async function () {
  const { submitAttempt } = await loadController(this);
  const answers = this.quiz.questions.map((q) => q.correctIndex);
  this.req = { body: { quizId: this.quiz._id, answers }, classGroupId: 'c1', user: { _id: 's1' } };
  this.res = fakeRes();
  await submitAttempt(this.req, this.res);
});

When('the student submits answers that match exactly 2 of the 4 correct options', async function () {
  const { submitAttempt } = await loadController(this);
  const correct = this.quiz.questions.map((q) => q.correctIndex);
  const answers = [correct[0], correct[1], 1 - correct[2], 1 - correct[3]]; // first 2 right, last 2 wrong
  this.req = { body: { quizId: this.quiz._id, answers }, classGroupId: 'c1', user: { _id: 's1' } };
  this.res = fakeRes();
  await submitAttempt(this.req, this.res);
});

When('the student submits the quiz again', async function () {
  const { submitAttempt } = await loadController(this);
  const answers = this.quiz.questions.map((q) => q.correctIndex);
  this.req = { body: { quizId: this.quiz._id, answers }, classGroupId: 'c1', user: { _id: 's1' } };
  this.res = fakeRes();
  await submitAttempt(this.req, this.res);
});

When('the student submits an empty set of answers', async function () {
  const { submitAttempt } = await loadController(this);
  this.req = { body: { quizId: this.quiz._id, answers: [] }, classGroupId: 'c1', user: { _id: 's1' } };
  this.res = fakeRes();
  await submitAttempt(this.req, this.res);
});

Then('the recorded score should be {int}', function (expected) {
  assert.equal(this.res.body.score, expected);
});

Then('the request should be rejected with status {int}', function (expected) {
  assert.equal(this.res.statusCode, expected);
});
