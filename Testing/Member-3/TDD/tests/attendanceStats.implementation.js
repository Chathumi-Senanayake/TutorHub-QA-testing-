// Extracted from attendanceController.getMyAttendance() via TDD (Lesson 5) so the
// percentage math can be unit-tested on its own, with no database involved.
export function calculateAttendancePercentage(records) {
  const total = records.length;
  const present = records.filter((r) => r.status === 'present' || r.status === 'late').length;
  const late = records.filter((r) => r.status === 'late').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const pct = total ? Math.round((present / total) * 100) : 0;
  return { total, present: present - late, late, absent, pct };
}
