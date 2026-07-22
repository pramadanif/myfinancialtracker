import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  subWeeks,
  eachDayOfInterval,
  subDays,
  isSameDay,
  parseISO,
} from "date-fns";
import { id } from "date-fns/locale";

export function getDayRange(date: Date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getWeekRange(date: Date = new Date()) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function getMonthRange(date: Date = new Date()) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function formatDateId(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMM yyyy", { locale: id });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMM", { locale: id });
}

export function formatDayName(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEE", { locale: id });
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy", { locale: id });
}

export function getLastNWeeks(n: number, from: Date = new Date()) {
  const weeks: { start: Date; end: Date; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const weekDate = subWeeks(from, i);
    const { start, end } = getWeekRange(weekDate);
    weeks.push({
      start,
      end,
      label: `${format(start, "d MMM")} - ${format(end, "d MMM")}`,
    });
  }
  return weeks;
}

export function getLast7Days(from: Date = new Date()) {
  return eachDayOfInterval({
    start: subDays(from, 6),
    end: from,
  });
}

export function toISODateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateInput(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export { isSameDay, parseISO, format, startOfMonth, endOfMonth, subDays, subWeeks };
