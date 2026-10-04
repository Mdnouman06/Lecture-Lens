/**
 * Calendar and date utility functions for LectureLens Study Planner
 */

export interface DayMeta {
  index: number;
  dayName: string;
  dateNum: string;
  monthName: string;
  isToday: boolean;
  fullDate: Date;
}

/**
 * Returns the 7 days (Monday through Sunday) for the given offset from current week.
 */
export function getWeekDays(offsetWeeks: number = 0): DayMeta[] {
  const now = new Date();
  const base = new Date(now);
  base.setDate(base.getDate() + offsetWeeks * 7);
  const day = base.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + diffToMonday);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayDateStr = now.toDateString();

  return dayNames.map((dayName, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    return {
      index: idx,
      dayName,
      dateNum: String(d.getDate()).padStart(2, '0'),
      monthName: d.toLocaleString('default', { month: 'short' }),
      isToday: d.toDateString() === todayDateStr,
      fullDate: d,
    };
  });
}

/**
 * Returns Monday-indexed day of week (0 = Monday, 6 = Sunday)
 */
export function getTodayDayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}
