export type CalendarDay = {
  total: number;
  fixedTotal: number;
  variableTotal: number;
  count: number;
  bigCount: number;
  maxAmount: number;
  categories: { name: string; iconName: string; type: string; amount: number; count: number }[];
};

export type MonthStats = {
  total: number;
  fixedTotal: number;
  avgPerDay: number;
  weekdayAvg: number;
  weekendAvg: number;
  topDay: { dateKey: string; amount: number } | null;
  bigCount: number;
  elapsedDays: number;
};

/** Tanpa "Rp" & desimal — muat di sel kalender 1/7 lebar layar */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    const jt = value / 1_000_000;
    return `${jt.toLocaleString("id-ID", { maximumFractionDigits: jt >= 10 ? 0 : 2 })}jt`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}rb`;
  return String(value);
}

export function dayValue(day: CalendarDay | undefined, hideFixed: boolean): number {
  if (!day) return 0;
  return hideFixed ? day.variableTotal : day.total;
}

/** 0 = kosong, 1–5 = hemat sampai boros, relatif ke rata-rata harian */
export function heatLevel(value: number, avg: number): number {
  if (value <= 0) return 0;
  if (avg <= 0) return 3;
  const ratio = value / avg;
  if (ratio < 0.6) return 1;
  if (ratio < 1) return 2;
  if (ratio < 1.5) return 3;
  if (ratio < 2.5) return 4;
  return 5;
}

export const HEAT_CLASSES = [
  "bg-transparent",
  "bg-emerald-50",
  "bg-emerald-100",
  "bg-amber-100",
  "bg-orange-200",
  "bg-rose-300",
];

export const HEAT_AMOUNT_TEXT = [
  "text-text-tertiary",
  "text-emerald-700",
  "text-emerald-800",
  "text-amber-800",
  "text-orange-900",
  "text-rose-900",
];

const FOOD_ICON = "utensils-crossed";

/** Ikon non-makan (makan terjadi tiap hari, jadi tidak informatif) */
export function auditIcons(day: CalendarDay | undefined, max = 3) {
  if (!day) return [];
  return day.categories.filter((c) => c.iconName !== FOOD_ICON).slice(0, max);
}

export function computeMonthStats(
  days: Record<string, CalendarDay>,
  dateKeys: string[],
  elapsedDays: number,
  hideFixed: boolean
): MonthStats {
  let total = 0;
  let fixedTotal = 0;
  let bigCount = 0;
  let weekdaySum = 0;
  let weekdayCount = 0;
  let weekendSum = 0;
  let weekendCount = 0;
  let topDay: MonthStats["topDay"] = null;

  dateKeys.slice(0, elapsedDays).forEach((dateKey) => {
    const day = days[dateKey];
    const value = dayValue(day, hideFixed);
    total += value;
    fixedTotal += day?.fixedTotal ?? 0;
    bigCount += day?.bigCount ?? 0;

    const weekday = new Date(`${dateKey}T12:00:00+07:00`).getUTCDay();
    if (weekday === 0 || weekday === 6) {
      weekendSum += value;
      weekendCount += 1;
    } else {
      weekdaySum += value;
      weekdayCount += 1;
    }

    if (value > 0 && (!topDay || value > topDay.amount)) topDay = { dateKey, amount: value };
  });

  return {
    total,
    fixedTotal,
    avgPerDay: elapsedDays > 0 ? total / elapsedDays : 0,
    weekdayAvg: weekdayCount > 0 ? weekdaySum / weekdayCount : 0,
    weekendAvg: weekendCount > 0 ? weekendSum / weekendCount : 0,
    topDay,
    bigCount,
    elapsedDays,
  };
}
