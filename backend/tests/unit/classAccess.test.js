// Security testing (Lesson 7): the real access-control rule in TutorHub is
// "a student can only ever see THEIR OWN class data, and only a class's own
// teacher can manage it". These tests prove that rule holds at the middleware
// layer, which every class-scoped route (quizzes, attendance, payments...) sits behind.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockReq, mockRes } from '../helpers/mockRes.js';

vi.mock('../../src/models/ClassGroup.js', () => ({ default: { findById: vi.fn() } }));
vi.mock('../../src/models/Enrollment.js', () => ({ default: { findOne: vi.fn() } }));

const ClassGroup = (await import('../../src/models/ClassGroup.js')).default;
const Enrollment = (await import('../../src/models/Enrollment.js')).default;
const { loadClassGroup, requireOwnerTeacher, requireApprovedStudent, requireClassMember } =
  await import('../../src/middleware/classAccess.js');

describe('loadClassGroup', () => {
  beforeEach(() => vi.clearAllMocks());

  it('404s when the class id in the URL does not exist', async () => {
    ClassGroup.findById.mockResolvedValue(null);
    const req = mockReq({ params: { classGroupId: 'missing-id' } });
    const res = mockRes();
    const next = vi.fn();
    await loadClassGroup(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches the class and calls next() when it exists', async () => {
    const fakeClass = { _id: 'c1', teacher: 't1' };
    ClassGroup.findById.mockResolvedValue(fakeClass);
    const req = mockReq({ params: { classGroupId: 'c1' } });
    const res = mockRes();
    const next = vi.fn();
    await loadClassGroup(req, res, next);
    expect(req.targetClass).toBe(fakeClass);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('requireOwnerTeacher (a teacher must own the class to manage it)', () => {
  it('403s another teacher trying to manage a class they do not own', () => {
    const req = mockReq({ targetClass: { teacher: 'teacher-A' }, user: { _id: 'teacher-B' } });
    const res = mockRes();
    const next = vi.fn();
    requireOwnerTeacher(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('lets the owning teacher through', () => {
    const req = mockReq({ targetClass: { teacher: 'teacher-A' }, user: { _id: 'teacher-A' } });
    const res = mockRes();
    const next = vi.fn();
    requireOwnerTeacher(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('requireApprovedStudent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('403s a student with no enrollment in this class (cannot see a class they never joined)', async () => {
    Enrollment.findOne.mockResolvedValue(null);
    const req = mockReq({ targetClass: { _id: 'c1' }, user: { _id: 'student-X' } });
    const res = mockRes();
    const next = vi.fn();
    await requireApprovedStudent(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('403s a student whose request is still pending (not yet approved)', async () => {
    // Enrollment.findOne is called with status:'approved' in the filter, so a
    // pending-only student correctly gets null back from the (mocked) DB.
    Enrollment.findOne.mockResolvedValue(null);
    const req = mockReq({ targetClass: { _id: 'c1' }, user: { _id: 'student-X' } });
    const res = mockRes();
    const next = vi.fn();
    await requireApprovedStudent(req, res, next);
    expect(Enrollment.findOne).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('lets an approved student through and attaches req.enrollment', async () => {
    const fakeEnrollment = { _id: 'e1', status: 'approved' };
    Enrollment.findOne.mockResolvedValue(fakeEnrollment);
    const req = mockReq({ targetClass: { _id: 'c1' }, user: { _id: 'student-X' } });
    const res = mockRes();
    const next = vi.fn();
    await requireApprovedStudent(req, res, next);
    expect(req.enrollment).toBe(fakeEnrollment);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('requireClassMember (shared read access for quizzes/materials/notices/sessions)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('403s a teacher who does not own this class', async () => {
    const req = mockReq({ targetClass: { teacher: 'teacher-A' }, user: { _id: 'teacher-B', role: 'teacher' } });
    const res = mockRes();
    const next = vi.fn();
    await requireClassMember(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('lets the owning teacher through without touching Enrollment at all', async () => {
    const req = mockReq({ targetClass: { teacher: 'teacher-A' }, user: { _id: 'teacher-A', role: 'teacher' } });
    const res = mockRes();
    const next = vi.fn();
    await requireClassMember(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(Enrollment.findOne).not.toHaveBeenCalled();
  });

  it("403s a student trying to read a DIFFERENT student's class data (core isolation rule)", async () => {
    Enrollment.findOne.mockResolvedValue(null);
    const req = mockReq({ targetClass: { _id: 'c1', teacher: 'teacher-A' }, user: { _id: 'student-outsider', role: 'student' } });
    const res = mockRes();
    const next = vi.fn();
    await requireClassMember(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('lets an approved student through', async () => {
    Enrollment.findOne.mockResolvedValue({ _id: 'e1', status: 'approved' });
    const req = mockReq({ targetClass: { _id: 'c1', teacher: 'teacher-A' }, user: { _id: 'student-X', role: 'student' } });
    const res = mockRes();
    const next = vi.fn();
    await requireClassMember(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
