import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockReq, mockRes } from '../helpers/mockRes.js';

vi.mock('../../src/models/Attendance.js', () => ({ default: { find: vi.fn(), findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/models/Session.js', () => ({ default: { findOne: vi.fn(), find: vi.fn() } }));

const Attendance = (await import('../../src/models/Attendance.js')).default;
const Session = (await import('../../src/models/Session.js')).default;
const { markAttendance, getMyAttendance } = await import('../../src/controllers/attendanceController.js');

describe('markAttendance', () => {
  beforeEach(() => vi.clearAllMocks());

  it('400s when sessionId, studentId or status is missing', async () => {
    const req = mockReq({ body: { sessionId: 's1', studentId: 'st1' } }); // no status
    const res = mockRes();
    await markAttendance(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400s an invalid status (equivalence class: anything outside present/late/absent)', async () => {
    const req = mockReq({ body: { sessionId: 's1', studentId: 'st1', status: 'excused' } });
    const res = mockRes();
    await markAttendance(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('404s when the session does not belong to this class', async () => {
    Session.findOne.mockResolvedValue(null);
    const req = mockReq({ body: { sessionId: 's1', studentId: 'st1', status: 'present' }, classGroupId: 'c1' });
    const res = mockRes();
    await markAttendance(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('upserts the attendance record for a valid request', async () => {
    Session.findOne.mockResolvedValue({ _id: 's1', classGroup: 'c1' });
    Attendance.findOneAndUpdate.mockResolvedValue({ _id: 'rec1', status: 'present' });
    const req = mockReq({ body: { sessionId: 's1', studentId: 'st1', status: 'present' }, classGroupId: 'c1' });
    const res = mockRes();
    await markAttendance(req, res);
    expect(Attendance.findOneAndUpdate).toHaveBeenCalledWith(
      { session: 's1', student: 'st1' },
      expect.objectContaining({ status: 'present' }),
      { new: true, upsert: true }
    );
    expect(res.json).toHaveBeenCalledWith({ _id: 'rec1', status: 'present' });
  });
});

describe('getMyAttendance (percentage calculation)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('boundary case: zero sessions in the class gives 0% (not NaN or a crash)', async () => {
    Session.find.mockReturnValue({ select: vi.fn().mockResolvedValue([]) });
    Attendance.find.mockReturnValue({
      populate: vi.fn().mockReturnValue({ sort: vi.fn().mockResolvedValue([]) }),
    });
    const req = mockReq({ classGroupId: 'c1', user: { _id: 's1' } });
    const res = mockRes();
    await getMyAttendance(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ summary: { total: 0, present: 0, late: 0, absent: 0, pct: 0 } })
    );
  });

  it('boundary case: 8 present out of 10 sessions rounds to 80%', async () => {
    Session.find.mockReturnValue({ select: vi.fn().mockResolvedValue(Array.from({ length: 10 }, (_, i) => ({ _id: `s${i}` }))) });
    const records = [
      ...Array.from({ length: 8 }, (_, i) => ({ status: 'present' })),
      { status: 'absent' },
      { status: 'absent' },
    ];
    Attendance.find.mockReturnValue({
      populate: vi.fn().mockReturnValue({ sort: vi.fn().mockResolvedValue(records) }),
    });
    const req = mockReq({ classGroupId: 'c1', user: { _id: 's1' } });
    const res = mockRes();
    await getMyAttendance(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ summary: expect.objectContaining({ pct: 80 }) }));
  });

  it('counts "late" as present for the percentage, but reports it separately', async () => {
    Session.find.mockReturnValue({ select: vi.fn().mockResolvedValue([{ _id: 's0' }, { _id: 's1' }, { _id: 's2' }]) });
    const records = [{ status: 'present' }, { status: 'late' }, { status: 'absent' }];
    Attendance.find.mockReturnValue({
      populate: vi.fn().mockReturnValue({ sort: vi.fn().mockResolvedValue(records) }),
    });
    const req = mockReq({ classGroupId: 'c1', user: { _id: 's1' } });
    const res = mockRes();
    await getMyAttendance(req, res);
    // total=3, present-or-late=2 -> pct=67 (rounded); present field excludes the late one
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ summary: { total: 3, present: 1, late: 1, absent: 1, pct: 67 } })
    );
  });
});
