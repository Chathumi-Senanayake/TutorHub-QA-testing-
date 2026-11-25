import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockReq, mockRes } from '../helpers/mockRes.js';

vi.mock('../../src/models/ClassGroup.js', () => ({ default: { create: vi.fn(), find: vi.fn(), findById: vi.fn(), findByIdAndUpdate: vi.fn() } }));
vi.mock('../../src/models/Enrollment.js', () => ({
  default: { findOne: vi.fn(), create: vi.fn(), find: vi.fn(), countDocuments: vi.fn(), findOneAndUpdate: vi.fn() },
}));

const Enrollment = (await import('../../src/models/Enrollment.js')).default;
const { requestEnrollment, respondToEnrollment } = await import('../../src/controllers/classGroupController.js');

describe('requestEnrollment (a student asking to join a class)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('404s a request for a class that is not published', async () => {
    const req = mockReq({ targetClass: { published: false }, user: { _id: 's1' } });
    const res = mockRes();
    await requestEnrollment(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('409s a student who is already approved in this class', async () => {
    Enrollment.findOne.mockResolvedValue({ status: 'approved' });
    const req = mockReq({ targetClass: { published: true, _id: 'c1' }, user: { _id: 's1' } });
    const res = mockRes();
    await requestEnrollment(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('409s a student whose request is already pending', async () => {
    Enrollment.findOne.mockResolvedValue({ status: 'pending' });
    const req = mockReq({ targetClass: { published: true, _id: 'c1' }, user: { _id: 's1' } });
    const res = mockRes();
    await requestEnrollment(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('lets a previously-rejected student ask again by resetting the same record to pending', async () => {
    const existing = { status: 'rejected', save: vi.fn().mockResolvedValue(true) };
    Enrollment.findOne.mockResolvedValue(existing);
    const req = mockReq({ targetClass: { published: true, _id: 'c1' }, user: { _id: 's1' } });
    const res = mockRes();
    await requestEnrollment(req, res);
    expect(existing.status).toBe('pending');
    expect(existing.save).toHaveBeenCalledOnce();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('creates a brand-new enrollment request for a first-time applicant', async () => {
    Enrollment.findOne.mockResolvedValue(null);
    Enrollment.create.mockResolvedValue({ _id: 'e1', status: 'pending' });
    const req = mockReq({ targetClass: { published: true, _id: 'c1' }, user: { _id: 's1' } });
    const res = mockRes();
    await requestEnrollment(req, res);
    expect(Enrollment.create).toHaveBeenCalledWith({ student: 's1', classGroup: 'c1' });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('respondToEnrollment (a teacher approving/rejecting a request)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('400s a status outside {approved, rejected}', async () => {
    const req = mockReq({ body: { status: 'maybe' }, targetClass: { _id: 'c1' }, params: {} });
    const res = mockRes();
    await respondToEnrollment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(Enrollment.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('404s when the enrollment request does not exist in this class', async () => {
    Enrollment.findOneAndUpdate.mockReturnValue({ populate: vi.fn().mockResolvedValue(null) });
    const req = mockReq({ body: { status: 'approved' }, targetClass: { _id: 'c1' }, params: { enrollmentId: 'e1' } });
    const res = mockRes();
    await respondToEnrollment(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('approves a valid, existing pending request', async () => {
    Enrollment.findOneAndUpdate.mockReturnValue({
      populate: vi.fn().mockResolvedValue({ _id: 'e1', status: 'approved', student: { name: 'Nimal' } }),
    });
    const req = mockReq({ body: { status: 'approved' }, targetClass: { _id: 'c1' }, params: { enrollmentId: 'e1' } });
    const res = mockRes();
    await respondToEnrollment(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
  });

  // --- KNOWN DEFECT (see Testing/Member-4/Defects/Issue-1-Class-Capacity-Not-Enforced) ---
  // ClassGroup.maxStudents exists and is shown in the UI as "X / maxStudents seats",
  // but respondToEnrollment() never checks the current approved count against it
  // before approving one more. This test pins down TODAY's (buggy) behaviour so the
  // regression is visible the moment someone fixes it and forgets to update the test:
  // once fixed, this test should be changed to expect a 409/"class is full" response.
  it('BUG: currently approves a request even when the class is already at maxStudents (no capacity check)', async () => {
    Enrollment.findOneAndUpdate.mockReturnValue({
      populate: vi.fn().mockResolvedValue({ _id: 'e-extra', status: 'approved', student: { name: 'Extra Student' } }),
    });
    // targetClass says maxStudents: 15, and (per Testing/Member-4/Defects) the class
    // already has 15 approved students elsewhere in the DB - respondToEnrollment never
    // looks that up, so it approves the 16th seat anyway.
    const req = mockReq({ body: { status: 'approved' }, targetClass: { _id: 'c1', maxStudents: 15 }, params: { enrollmentId: 'e-extra' } });
    const res = mockRes();
    await respondToEnrollment(req, res);
    expect(res.status).not.toHaveBeenCalledWith(409); // documents the gap: nothing stops this today
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
  });
});
