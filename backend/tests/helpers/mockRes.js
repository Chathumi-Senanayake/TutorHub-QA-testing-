import { vi } from 'vitest';

// A minimal fake Express response object: res.status(n).json(body) and res.json(body)
// both work, and every call is recorded on the vi.fn()s so tests can assert on them.
export function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

export function mockReq(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
  };
}
