import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  subWeeks,
  eachDayOfInterval,
  subDays,
  addDays,
  isSameDay,
  parseISO,
} from "date-fns";
import { id } from "date-fns/locale";

/** Zona waktu app — konsisten server (UTC) & client (WIB) */
export const APP_TIMEZONE =
  (typeof process !== "undefined" && process.env.APP_TIMEZONE) || "Asia/Jakarta";

function appTimezoneOffset(dateStr: string): string {
  if (APP_TIMEZONE === "Asia/Jakarta") return "+07:00";
  const probe = new Date(`${dateStr}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    timeZoneName: "shortOffset",
  }).formatToParts(probe);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+7";
  const match = tz.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/);
  if (!match) return "+07:00";
  const sign = match[1].startsWith("-") ? "-" : "+";
  const h = Math.abs(parseInt(match[1], 10));
  const mins = match[2] ?? "00";
  return `${sign}${String(h).padStart(2, "0")}:${mins}`;
}

/** Tanggal kalender YYYY-MM-DD di zona app (WIB) */
export function toAppDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(date);
}

/** Alias — selalu WIB, bukan timezone browser/server */
export function toISODateString(date: Date): string {
  return toAppDateString(date);
}

export function todayAppDateString(): string {
  return toAppDateString(new Date());
}

/** Awal hari kalender di zona app */
export function parseAppDayStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00${appTimezoneOffset(dateStr)}`);
}

/** Akhir hari kalender di zona app */
export function parseAppDayEnd(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999${appTimezoneOffset(dateStr)}`);
}

export function parseDateInput(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00${appTimezoneOffset(dateStr)}`);
}

export function normalizeTransactionDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return parseDateInput(date);
  return new Date(date);
}

function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

/** Rentang satu hari kalender WIB */
export function getDayRange(date: Date = new Date()) {
  const key = toAppDateString(date);
  return { start: parseAppDayStart(key), end: parseAppDayEnd(key) };
}

/** Rentang minggu (Sen–Min) kalender WIB */
export function getWeekRange(date: Date = new Date()) {
  const dateKey = toAppDateString(date);
  const { day } = getAppTimeParts(date);
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const mondayKey = toAppDateString(addDays(parseAppDayStart(dateKey), -daysFromMonday));
  const sundayKey = toAppDateString(addDays(parseAppDayStart(mondayKey), 6));
  return {
    start: parseAppDayStart(mondayKey),
    end: parseAppDayEnd(sundayKey),
  };
}

export function getWeekRangeISO(date: Date = new Date()) {
  const { start, end } = getWeekRange(date);
  return { startDate: toAppDateString(start), endDate: toAppDateString(end) };
}

export function formatWeekRangeLabel(date: Date = new Date()): string {
  const { start, end } = getWeekRange(date);
  const startD = parseAppDayStart(toAppDateString(start));
  const endD = parseAppDayStart(toAppDateString(end));
  const sameMonth = toAppDateString(start).slice(0, 7) === toAppDateString(end).slice(0, 7);
  if (sameMonth) {
    return `${format(startD, "d", { locale: id })} – ${format(endD, "d MMM yyyy", { locale: id })}`;
  }
  return `${format(startD, "d MMM", { locale: id })} – ${format(endD, "d MMM yyyy", { locale: id })}`;
}

/** Rentang satu bulan kalender WIB */
export function getMonthRange(date: Date = new Date()) {
  const key = toAppDateString(date);
  const [y, m] = key.split("-").map(Number);
  const mm = String(m).padStart(2, "0");
  const startStr = `${y}-${mm}-01`;
  const lastDay = daysInMonth(y, m);
  const endStr = `${y}-${mm}-${String(lastDay).padStart(2, "0")}`;
  return {
    start: parseAppDayStart(startStr),
    end: parseAppDayEnd(endStr),
  };
}

export function formatDateId(date: Date | string): string {
  const d = typeof date === "string" ? parseAppDayStart(date) : date;
  return format(d, "d MMM yyyy", { locale: id });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? parseAppDayStart(date) : date;
  return format(d, "d MMM", { locale: id });
}

export function formatDayName(date: Date | string): string {
  const d = typeof date === "string" ? parseAppDayStart(date) : date;
  return format(d, "EEE", { locale: id });
}

export function formatMonthYear(date: Date): string {
  const d = parseAppDayStart(toAppDateString(date));
  return format(d, "MMMM yyyy", { locale: id });
}

export function getLastNWeeks(n: number, from: Date = new Date()) {
  const weeks: { start: Date; end: Date; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const weekDate = subWeeks(from, i);
    const { start, end } = getWeekRange(weekDate);
    weeks.push({
      start,
      end,
      label: `${format(parseAppDayStart(toAppDateString(start)), "d MMM")} - ${format(parseAppDayStart(toAppDateString(end)), "d MMM")}`,
    });
  }
  return weeks;
}

export function getLast7Days(from: Date = new Date()) {
  const endKey = toAppDateString(from);
  const startKey = toAppDateString(addDays(parseAppDayStart(endKey), -6));
  return eachDayOfInterval({
    start: parseAppDayStart(startKey),
    end: parseAppDayStart(endKey),
  });
}

/** Waktu app (WIB) — untuk cron notifikasi */
export function getAppTimeParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    hour: parseInt(get("hour"), 10),
    day: weekdayMap[get("weekday")] ?? 0,
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    timeZone: APP_TIMEZONE,
  };
}

export { isSameDay, parseISO, format, startOfMonth, endOfMonth, subDays, subWeeks, addDays };
