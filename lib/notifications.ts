import { prisma } from "./prisma";
import { sendPushNotification } from "./push";
import { getMonthRange, getWeekRange, getAppTimeParts, parseDateInput } from "./dates";
import { CategoryType } from "@/types/enums";
import { getWeeklyBudgetAlerts } from "./transactions";

interface BudgetAlert {
  id: string;
  categoryName: string;
  spent: number;
  budget: number;
  percent: number;
  period: "weekly" | "monthly";
}

async function getSubscriptions() {
  return prisma.pushSubscription.findMany();
}

async function getPreferences() {
  let prefs = await prisma.notificationPreference.findUnique({ where: { id: "default" } });
  if (!prefs) {
    prefs = await prisma.notificationPreference.create({ data: { id: "default" } });
  }
  return prefs;
}

async function broadcast(payload: { title: string; body: string; url?: string; tag?: string }) {
  const subs = await getSubscriptions();
  const results = await Promise.allSettled(
    subs.map((sub) =>
      sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
    )
  );

  const failed = results
    .map((r, i) => ({ r, sub: subs[i] }))
    .filter(({ r }) => r.status === "rejected");

  for (const { sub } of failed) {
    await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
  }

  return { sent: results.filter((r) => r.status === "fulfilled").length, failed: failed.length };
}

function isSameAppDay(a: Date | null | undefined, dateKey: string) {
  if (!a) return false;
  return getAppTimeParts(a).dateKey === dateKey;
}

export async function sendTestNotification() {
  return broadcast({
    title: "Test Notifikasi",
    body: "Push notification berhasil! Finance Tracker siap mengingatkan kamu.",
    url: "/dashboard",
    tag: "test-notification",
  });
}

export async function checkDailyReminder(now = new Date()) {
  const prefs = await getPreferences();
  const { hour, dateKey } = getAppTimeParts(now);
  if (!prefs.dailyReminder) return { skipped: true, reason: "disabled" };
  if (hour !== prefs.dailyReminderHour) return { skipped: true, reason: "wrong hour" };
  if (isSameAppDay(prefs.lastDailySent, dateKey)) {
    return { skipped: true, reason: "already sent today" };
  }

  const dayStart = parseDateInput(dateKey);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const count = await prisma.transaction.count({
    where: { date: { gte: dayStart, lte: dayEnd } },
  });

  if (count > 0) {
    await prisma.notificationPreference.update({
      where: { id: "default" },
      data: { lastDailySent: now },
    });
    return { skipped: true, reason: "has transactions today" };
  }

  const result = await broadcast({
    title: "Belum catat hari ini?",
    body: "Kamu belum input transaksi hari ini. Tap untuk tambah cepat.",
    url: "/?quickAdd=1",
    tag: "daily-reminder",
  });

  await prisma.notificationPreference.update({
    where: { id: "default" },
    data: { lastDailySent: now },
  });

  return { type: "daily-reminder", ...result };
}

export async function checkBudgetAlerts(now = new Date()) {
  const prefs = await getPreferences();
  if (!prefs.budgetAlert) return { skipped: true, reason: "disabled" };

  const { dateKey: todayKey } = getAppTimeParts(now);
  const lastAlerts: Record<string, string> = JSON.parse(prefs.lastBudgetAlerts || "{}");
  const alerts: BudgetAlert[] = [];

  const weeklyAlerts = await getWeeklyBudgetAlerts(90);
  for (const item of weeklyAlerts) {
    const key = `w:${item.id}`;
    if (lastAlerts[key] !== todayKey) {
      alerts.push({
        id: item.id,
        categoryName: item.name,
        spent: item.spent,
        budget: item.budget,
        percent: item.percentage,
        period: "weekly",
      });
    }
  }

  const { start, end } = getMonthRange(now);
  const categories = await prisma.category.findMany({
    where: {
      type: { notIn: [CategoryType.INCOME, CategoryType.TRANSFER] },
      monthlyBudget: { not: null },
    },
  });

  for (const cat of categories) {
    if (!cat.monthlyBudget) continue;
    const key = `m:${cat.id}`;
    if (lastAlerts[key] === todayKey) continue;

    const spent = await prisma.transaction.aggregate({
      where: {
        categoryId: cat.id,
        type: "DEBIT",
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    });
    const total = spent._sum.amount || 0;
    const percent = (total / cat.monthlyBudget) * 100;
    if (percent >= 90) {
      alerts.push({
        id: cat.id,
        categoryName: cat.name,
        spent: total,
        budget: cat.monthlyBudget,
        percent,
        period: "monthly",
      });
    }
  }

  if (alerts.length === 0) return { skipped: true, reason: "no alerts" };

  const top = alerts.sort((a, b) => b.percent - a.percent)[0];
  const periodLabel = top.period === "weekly" ? "mingguan" : "bulanan";
  const result = await broadcast({
    title: `Budget ${top.categoryName} ${Math.round(top.percent)}%`,
    body: `Pengeluaran ${periodLabel} sudah Rp${Math.round(top.spent).toLocaleString("id-ID")} dari Rp${Math.round(top.budget).toLocaleString("id-ID")}.`,
    url: "/budget",
    tag: `budget-${top.period}-${top.id}`,
  });

  for (const alert of alerts) {
    const key = `${alert.period === "weekly" ? "w" : "m"}:${alert.id}`;
    lastAlerts[key] = todayKey;
  }

  await prisma.notificationPreference.update({
    where: { id: "default" },
    data: { lastBudgetAlerts: JSON.stringify(lastAlerts) },
  });

  return { type: "budget-alert", alerts: alerts.length, ...result };
}

export async function checkWeeklySummary(now = new Date()) {
  const prefs = await getPreferences();
  if (!prefs.weeklySummary) return { skipped: true, reason: "disabled" };

  const { hour, day, dateKey } = getAppTimeParts(now);
  if (day !== prefs.weeklySummaryDay) return { skipped: true, reason: "wrong day" };
  if (hour !== prefs.weeklySummaryHour) return { skipped: true, reason: "wrong hour" };
  if (isSameAppDay(prefs.lastWeeklySent, dateKey)) {
    return { skipped: true, reason: "already sent" };
  }

  const { start, end } = getWeekRange(now);
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - 7);
  const prevEnd = new Date(start);
  prevEnd.setMilliseconds(-1);

  const [thisWeek, lastWeek] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: "DEBIT", date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "DEBIT", date: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true },
    }),
  ]);

  const thisTotal = thisWeek._sum.amount || 0;
  const lastTotal = lastWeek._sum.amount || 0;
  const diff = thisTotal - lastTotal;
  const diffLabel =
    diff === 0
      ? "sama seperti minggu lalu"
      : diff > 0
        ? `naik Rp${Math.round(diff).toLocaleString("id-ID")}`
        : `turun Rp${Math.round(Math.abs(diff)).toLocaleString("id-ID")}`;

  const result = await broadcast({
    title: "Ringkasan Mingguan",
    body: `Pengeluaran minggu ini: Rp${Math.round(thisTotal).toLocaleString("id-ID")} (${diffLabel}).`,
    url: "/reports",
    tag: "weekly-summary",
  });

  await prisma.notificationPreference.update({
    where: { id: "default" },
    data: { lastWeeklySent: now },
  });

  return { type: "weekly-summary", ...result };
}

export async function runAllNotificationChecks(now = new Date()) {
  const [daily, budget, weekly] = await Promise.all([
    checkDailyReminder(now),
    checkBudgetAlerts(now),
    checkWeeklySummary(now),
  ]);
  return { daily, budget, weekly };
}
