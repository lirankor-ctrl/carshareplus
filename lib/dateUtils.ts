import {
  format, startOfWeek, endOfWeek, eachDayOfInterval,
  addWeeks, subWeeks, addMonths, subMonths,
  startOfMonth, endOfMonth, isSameDay, isSameMonth,
  parseISO, isToday, addDays,
} from 'date-fns';

export const HEBREW_DAYS_SHORT = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
export const HEBREW_DAYS_LONG = [
  'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת',
];
export const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

export function formatDateHebrew(date: Date): string {
  return `${date.getDate()} ב${HEBREW_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatMonthYearHebrew(date: Date): string {
  return `${HEBREW_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
  return eachDayOfInterval({ start, end: addDays(start, 6) });
}

export function getMonthGrid(date: Date): (Date | null)[][] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDay = startOfWeek(monthStart, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDay, end: addDays(startDay, 41) });
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < 6; i++) {
    weeks.push(days.slice(i * 7, i * 7 + 7));
  }
  return weeks;
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromDateString(str: string): Date {
  return parseISO(str);
}

export {
  addWeeks, subWeeks, addMonths, subMonths,
  isSameDay, isSameMonth, isToday, format, addDays,
};
