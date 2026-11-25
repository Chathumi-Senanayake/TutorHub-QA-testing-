// TDD demonstration (Lesson 5): this test was written BEFORE
// src/utils/attendanceStats.js existed - see Testing/Member-3/TDD/ for the
// real "Red" terminal output this produced on its first run.
import { describe, it, expect } from 'vitest';
import { calculateAttendancePercentage } from '../../src/utils/attendanceStats.js';

describe('calculateAttendancePercentage (extracted from attendanceController.getMyAttendance)', () => {
  it('returns 0 for an empty record list (boundary case)', () => {
    expect(calculateAttendancePercentage([])).toEqual({ total: 0, present: 0, late: 0, absent: 0, pct: 0 });
  });

  it('rounds 8/10 present to pct=80', () => {
    const records = [
      ...Array.from({ length: 8 }, () => ({ status: 'present' })),
      { status: 'absent' },
      { status: 'absent' },
    ];
    expect(calculateAttendancePercentage(records)).toEqual({ total: 10, present: 8, late: 0, absent: 2, pct: 80 });
  });

  it('counts "late" as present for pct but reports it separately', () => {
    const records = [{ status: 'present' }, { status: 'late' }, { status: 'absent' }];
    expect(calculateAttendancePercentage(records)).toEqual({ total: 3, present: 1, late: 1, absent: 1, pct: 67 });
  });
});
