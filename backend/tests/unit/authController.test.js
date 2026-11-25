import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockReq, mockRes } from '../helpers/mockRes.js';

vi.mock('../../src/models/User.js', () => ({
  default: { findOne: vi.fn(), create: vi.fn() },
}));
vi.mock('../../src/utils/generateToken.js', () => ({
  generateToken: vi.fn(() => 'fake.jwt.token'),
}));

const User = (await import('../../src/models/User.js')).default;
const { register, login } = await import('../../src/controllers/authController.js');

describe('authController.register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects when a required field is missing (equivalence class: incomplete input)', async () => {
    const req = mockReq({ body: { name: 'Nimal', email: 'nimal@test.lk', password: 'secret1' } }); // no role
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects a role outside {teacher, student}', async () => {
    const req = mockReq({ body: { name: 'Nimal', email: 'nimal@test.lk', password: 'secret1', role: 'admin' } });
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects a duplicate email with 409', async () => {
    User.findOne.mockResolvedValueOnce({ _id: 'existing-user' });
    const req = mockReq({ body: { name: 'Nimal', email: 'dup@test.lk', password: 'secret1', role: 'student' } });
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('creates a student account and returns a token on valid input', async () => {
    User.findOne.mockResolvedValueOnce(null);
    User.create.mockResolvedValueOnce({
      _id: 'u1', name: 'Nimal', email: 'nimal@test.lk', role: 'student', grade: 'Grade 11',
    });
    const req = mockReq({ body: { name: 'Nimal', email: 'nimal@test.lk', password: 'secret1', role: 'student', grade: 'Grade 11' } });
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'fake.jwt.token', user: expect.objectContaining({ email: 'nimal@test.lk' }) })
    );
  });

  it('forces grade to null for a teacher account even if the client sends one', async () => {
    User.findOne.mockResolvedValueOnce(null);
    User.create.mockResolvedValueOnce({ _id: 'u2', name: 'Ms. Silva', email: 't@test.lk', role: 'teacher', grade: null });
    const req = mockReq({ body: { name: 'Ms. Silva', email: 't@test.lk', password: 'secret1', role: 'teacher', grade: 'Grade 11' } });
    const res = mockRes();
    await register(req, res);
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ grade: null }));
  });
});

describe('authController.login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects missing email/password with 400', async () => {
    const req = mockReq({ body: { email: 'nimal@test.lk' } });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects an unknown email with 401 (no account enumeration in the message)', async () => {
    User.findOne.mockReturnValueOnce({ select: vi.fn().mockResolvedValue(null) });
    const req = mockReq({ body: { email: 'nobody@test.lk', password: 'secret1' } });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
  });

  it('rejects when the account role does not match the requested login role', async () => {
    const fakeUser = { _id: 'u1', role: 'student', comparePassword: vi.fn() };
    User.findOne.mockReturnValueOnce({ select: vi.fn().mockResolvedValue(fakeUser) });
    const req = mockReq({ body: { email: 'nimal@test.lk', password: 'secret1', role: 'teacher' } });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(fakeUser.comparePassword).not.toHaveBeenCalled();
  });

  it('rejects a wrong password with 401', async () => {
    const fakeUser = { _id: 'u1', role: 'student', comparePassword: vi.fn().mockResolvedValue(false) };
    User.findOne.mockReturnValueOnce({ select: vi.fn().mockResolvedValue(fakeUser) });
    const req = mockReq({ body: { email: 'nimal@test.lk', password: 'wrong' } });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('logs in successfully with correct credentials and returns a token', async () => {
    const fakeUser = { _id: 'u1', name: 'Nimal', email: 'nimal@test.lk', role: 'student', grade: 'Grade 11', comparePassword: vi.fn().mockResolvedValue(true) };
    User.findOne.mockReturnValueOnce({ select: vi.fn().mockResolvedValue(fakeUser) });
    const req = mockReq({ body: { email: 'nimal@test.lk', password: 'secret1' } });
    const res = mockRes();
    await login(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'fake.jwt.token' }));
  });
});
