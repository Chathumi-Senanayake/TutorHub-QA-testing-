// Security testing (Lesson 7) lives here too: this file proves TutorHub actually
// rejects a missing token, a malformed token, and a token for a deleted user,
// and that role-based access (allowRoles) is enforced.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockReq, mockRes } from '../helpers/mockRes.js';

vi.mock('jsonwebtoken', () => ({ default: { verify: vi.fn() } }));
vi.mock('../../src/models/User.js', () => ({ default: { findById: vi.fn() } }));

const jwt = (await import('jsonwebtoken')).default;
const User = (await import('../../src/models/User.js')).default;
const { protect, allowRoles } = await import('../../src/middleware/auth.js');

describe('auth middleware: protect()', () => {
  beforeEach(() => vi.clearAllMocks());

  it('401s a request with no Authorization header at all', async () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();
    const next = vi.fn();
    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('401s a header that is not "Bearer <token>"', async () => {
    const req = mockReq({ headers: { authorization: 'Basic abc123' } });
    const res = mockRes();
    const next = vi.fn();
    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('401s a token that fails verification (tampered/expired)', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('jwt malformed'); });
    const req = mockReq({ headers: { authorization: 'Bearer bad.token.here' } });
    const res = mockRes();
    const next = vi.fn();
    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('401s a well-formed token whose user no longer exists (deleted account)', async () => {
    jwt.verify.mockReturnValue({ id: 'ghost-user' });
    User.findById.mockResolvedValue(null);
    const req = mockReq({ headers: { authorization: 'Bearer good.token.here' } });
    const res = mockRes();
    const next = vi.fn();
    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches req.user and calls next() for a valid token', async () => {
    jwt.verify.mockReturnValue({ id: 'u1' });
    const fakeUser = { _id: 'u1', role: 'student' };
    User.findById.mockResolvedValue(fakeUser);
    const req = mockReq({ headers: { authorization: 'Bearer good.token.here' } });
    const res = mockRes();
    const next = vi.fn();
    await protect(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBe(fakeUser);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('auth middleware: allowRoles()', () => {
  it('403s when req.user is missing', () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    allowRoles('teacher')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('403s a student hitting a teacher-only route', () => {
    const req = mockReq({ user: { role: 'student' } });
    const res = mockRes();
    const next = vi.fn();
    allowRoles('teacher')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('lets a teacher through a teacher-only route', () => {
    const req = mockReq({ user: { role: 'teacher' } });
    const res = mockRes();
    const next = vi.fn();
    allowRoles('teacher')(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
