// White-box / TDD target (Lessons 4-5): quiz auto-grading is the piece of logic
// most worth statement+branch coverage on, since a wrong score is invisible to
// the student and the teacher unless someone tests it directly.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockReq, mockRes } from '../helpers/mockRes.js';

vi.mock('../../src/models/Quiz.js', () => ({ default: { findOne: vi.fn(), find: vi.fn() } }));
vi.mock('../../src/models/Attempt.js', () => ({ default: { findOne: vi.fn(), create: vi.fn(), find: vi.fn() } }));

const Quiz = (await import('../../src/models/Quiz.js')).default;
const Attempt = (await import('../../src/models/Attempt.js')).default;
const { submitAttempt, getMyProgress } = await import('../../src/controllers/attemptController.js');

function fourQuestionQuiz(overrides = {}) {
  return {
    _id: 'quiz1',
    classGroup: 'c1',
    published: true,
    questions: [
      { text: 'Q1', options: ['a', 'b'], correctIndex: 0 },
      { text: 'Q2', options: ['a', 'b'], correctIndex: 1 },
      { text: 'Q3', options: ['a', 'b'], correctIndex: 0 },
      { text: 'Q4', options: ['a', 'b'], correctIndex: 1 },
    ],
    ...overrides,
  };
}

describe('submitAttempt (quiz auto-grading)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects a request missing quizId or answers[] with 400', async () => {
    const req = mockReq({ body: { quizId: 'quiz1' }, classGroupId: 'c1', user: { _id: 's1' } }); // no answers
    const res = mockRes();
    await submitAttempt(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('404s when the quiz does not exist, is in a different class, or is unpublished', async () => {
    Quiz.findOne.mockResolvedValue(null);
    const req = mockReq({ body: { quizId: 'quiz1', answers: [0, 1, 0, 1] }, classGroupId: 'c1', user: { _id: 's1' } });
    const res = mockRes();
    await submitAttempt(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('409s a second attempt at the same quiz by the same student', async () => {
    Quiz.findOne.mockResolvedValue(fourQuestionQuiz());
    Attempt.findOne.mockResolvedValue({ _id: 'existing-attempt' });
    const req = mockReq({ body: { quizId: 'quiz1', answers: [0, 1, 0, 1] }, classGroupId: 'c1', user: { _id: 's1' } });
    const res = mockRes();
    await submitAttempt(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(Attempt.create).not.toHaveBeenCalled();
  });

  it('scores a fully-correct attempt as 100', async () => {
    Quiz.findOne.mockResolvedValue(fourQuestionQuiz());
    Attempt.findOne.mockResolvedValue(null);
    Attempt.create.mockResolvedValue({ _id: 'a1' });
    const req = mockReq({ body: { quizId: 'quiz1', answers: [0, 1, 0, 1] }, classGroupId: 'c1', user: { _id: 's1' } });
    const res = mockRes();
    await submitAttempt(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ score: 100, correct: 4, total: 4 }));
  });

  it('scores a half-correct attempt as 50 (equivalence class: partial credit)', async () => {
    Quiz.findOne.mockResolvedValue(fourQuestionQuiz());
    Attempt.findOne.mockResolvedValue(null);
    Attempt.create.mockResolvedValue({ _id: 'a1' });
    const req = mockReq({ body: { quizId: 'quiz1', answers: [0, 0, 0, 0] }, classGroupId: 'c1', user: { _id: 's1' } }); // 2 of 4 right
    const res = mockRes();
    await submitAttempt(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ score: 50, correct: 2 }));
  });

  it('scores a fully-wrong attempt as 0', async () => {
    Quiz.findOne.mockResolvedValue(fourQuestionQuiz());
    Attempt.findOne.mockResolvedValue(null);
    Attempt.create.mockResolvedValue({ _id: 'a1' });
    const req = mockReq({ body: { quizId: 'quiz1', answers: [1, 0, 1, 0] }, classGroupId: 'c1', user: { _id: 's1' } });
    const res = mockRes();
    await submitAttempt(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ score: 0, correct: 0 }));
  });

  it('boundary case: a quiz with zero questions scores 0, never NaN or a crash', async () => {
    Quiz.findOne.mockResolvedValue(fourQuestionQuiz({ questions: [] }));
    Attempt.findOne.mockResolvedValue(null);
    Attempt.create.mockResolvedValue({ _id: 'a1' });
    const req = mockReq({ body: { quizId: 'quiz1', answers: [] }, classGroupId: 'c1', user: { _id: 's1' } });
    const res = mockRes();
    await submitAttempt(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ score: 0, total: 0 }));
  });

  it('ignores extra/missing answer entries rather than throwing (answers[] shorter than questions[])', async () => {
    Quiz.findOne.mockResolvedValue(fourQuestionQuiz());
    Attempt.findOne.mockResolvedValue(null);
    Attempt.create.mockResolvedValue({ _id: 'a1' });
    const req = mockReq({ body: { quizId: 'quiz1', answers: [0] }, classGroupId: 'c1', user: { _id: 's1' } }); // only answered Q1
    const res = mockRes();
    await submitAttempt(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ correct: 1, total: 4 }));
  });
});

describe('getMyProgress (groups attempts by subject, sorted by quiz order)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('groups scores by subject and sorts each subject by the quiz order field', async () => {
    Quiz.find.mockReturnValue({ select: vi.fn().mockResolvedValue([{ _id: 'q1' }, { _id: 'q2' }, { _id: 'q3' }]) });
    Attempt.find.mockReturnValue({
      populate: vi.fn().mockResolvedValue([
        { quiz: { subject: 'Pure Maths', order: 2, title: 'Quiz 2' }, score: 80 },
        { quiz: { subject: 'Pure Maths', order: 1, title: 'Quiz 1' }, score: 60 },
        { quiz: { subject: 'Applied Maths', order: 1, title: 'Quiz A1' }, score: 90 },
      ]),
    });
    const req = mockReq({ classGroupId: 'c1', user: { _id: 's1' } });
    const res = mockRes();
    await getMyProgress(req, res);
    expect(res.json).toHaveBeenCalledWith({
      'Pure Maths': [{ order: 1, title: 'Quiz 1', score: 60 }, { order: 2, title: 'Quiz 2', score: 80 }],
      'Applied Maths': [{ order: 1, title: 'Quiz A1', score: 90 }],
    });
  });

  it('skips an attempt whose quiz was since deleted (populate returns null)', async () => {
    Quiz.find.mockReturnValue({ select: vi.fn().mockResolvedValue([{ _id: 'q1' }]) });
    Attempt.find.mockReturnValue({
      populate: vi.fn().mockResolvedValue([{ quiz: null, score: 70 }]),
    });
    const req = mockReq({ classGroupId: 'c1', user: { _id: 's1' } });
    const res = mockRes();
    await getMyProgress(req, res);
    expect(res.json).toHaveBeenCalledWith({});
  });
});
