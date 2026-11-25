import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockReq, mockRes } from '../helpers/mockRes.js';

vi.mock('../../src/models/Payment.js', () => ({
  default: { find: vi.fn(), findOne: vi.fn(), create: vi.fn(), findOneAndUpdate: vi.fn() },
}));
vi.mock('../../src/models/Enrollment.js', () => ({ default: { find: vi.fn() } }));

const Payment = (await import('../../src/models/Payment.js')).default;
const Enrollment = (await import('../../src/models/Enrollment.js')).default;
const { updatePayment, generateMonthlyPayments } = await import('../../src/controllers/paymentController.js');

describe('updatePayment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('400s a status outside {paid, due, overdue}', async () => {
    const req = mockReq({ body: { status: 'cancelled' }, params: { id: 'p1' }, classGroupId: 'c1' });
    const res = mockRes();
    await updatePayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('404s a payment id that does not belong to this class', async () => {
    Payment.findOneAndUpdate.mockResolvedValue(null);
    const req = mockReq({ body: { status: 'paid' }, params: { id: 'p1' }, classGroupId: 'c1' });
    const res = mockRes();
    await updatePayment(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('marks a payment paid and stamps paidAt', async () => {
    Payment.findOneAndUpdate.mockResolvedValue({ _id: 'p1', status: 'paid', paidAt: new Date() });
    const req = mockReq({ body: { status: 'paid' }, params: { id: 'p1' }, classGroupId: 'c1' });
    const res = mockRes();
    await updatePayment(req, res);
    expect(Payment.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'p1', classGroup: 'c1' },
      expect.objectContaining({ status: 'paid', paidAt: expect.any(Date) }),
      { new: true }
    );
  });

  it('clears paidAt when a payment is reverted to due', async () => {
    Payment.findOneAndUpdate.mockResolvedValue({ _id: 'p1', status: 'due', paidAt: null });
    const req = mockReq({ body: { status: 'due' }, params: { id: 'p1' }, classGroupId: 'c1' });
    const res = mockRes();
    await updatePayment(req, res);
    expect(Payment.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'due', paidAt: null }),
      expect.anything()
    );
  });
});

describe('generateMonthlyPayments (one "due" record per approved student per month)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('skips a student who already has a payment record for this month', async () => {
    Enrollment.find.mockReturnValue({ select: vi.fn().mockResolvedValue([{ student: 'stu1' }]) });
    Payment.findOne.mockResolvedValue({ _id: 'already-there' });
    const req = mockReq({ body: { month: '2026-11' }, classGroupId: 'c1', targetClass: { monthlyFee: 3000 } });
    const res = mockRes();
    await generateMonthlyPayments(req, res);
    expect(Payment.create).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ createdCount: 0 }));
  });

  it('creates a due record using the class monthlyFee for a student with none yet', async () => {
    Enrollment.find.mockReturnValue({ select: vi.fn().mockResolvedValue([{ student: 'stu2' }]) });
    Payment.findOne.mockResolvedValue(null);
    Payment.create.mockResolvedValue({ _id: 'new1', student: 'stu2', amount: 4500, status: 'due' });
    const req = mockReq({ body: { month: '2026-11' }, classGroupId: 'c1', targetClass: { monthlyFee: 4500 } });
    const res = mockRes();
    await generateMonthlyPayments(req, res);
    expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 4500, status: 'due' }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ createdCount: 1 }));
  });
});
