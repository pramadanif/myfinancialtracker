import { prisma } from "./prisma";
import { getWeekRange, getMonthRange, getDayRange, toISODateString, parseAppDayStart, parseAppDayEnd, toAppDateString, normalizeTransactionDate, addDays } from "./dates";
import { CategoryType, TransactionType, BudgetPeriod } from "@/types/enums";
import type { AddTransactionInput, TransferInput, WeeklyBudgetAlert } from "@/types";

export type { WeeklyBudgetAlert };

export function isExpenseType(type: string): boolean {
  return type === TransactionType.DEBIT || type === TransactionType.TRANSFER_OUT;
}

export function isIncomeType(type: string): boolean {
  return type === TransactionType.CREDIT;
}

export function isTransferType(type: string): boolean {
  return type === TransactionType.TRANSFER_OUT || type === TransactionType.TRANSFER_IN;
}

export async function createTransaction(input: AddTransactionInput) {
  const { accountId, categoryId, amount, type, description, date } = input;

  if (amount <= 0) throw new Error("Nominal harus lebih dari 0");
  if (!categoryId) throw new Error("Kategori wajib diisi");

  const settings = await getAppSettings();
  const isDebit = type === TransactionType.DEBIT;
  const isCheckin = input.isCheckin ?? (settings.checkinModeActive && isDebit);
  const isPacaran = input.isPacaran ?? (settings.pacaranModeActive && isDebit);

  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        accountId,
        categoryId,
        amount,
        type: type as TransactionType,
        description: description || "",
        date: normalizeTransactionDate(date),
        isCheckin,
        isPacaran,
      },
      include: { account: true, category: true },
    });

    const balanceChange = type === "CREDIT" ? amount : -amount;
    await tx.account.update({
      where: { id: accountId },
      data: { currentBalance: { increment: balanceChange } },
    });

    return created;
  });

  return transaction;
}

export async function createTransfer(input: TransferInput) {
  const { fromAccountId, toAccountId, amount, description, date } = input;

  if (amount <= 0) throw new Error("Nominal harus lebih dari 0");
  if (fromAccountId === toAccountId) throw new Error("Akun asal dan tujuan tidak boleh sama");

  const transferCategory = await prisma.category.findFirst({
    where: { type: CategoryType.TRANSFER },
  });

  if (!transferCategory) throw new Error("Kategori transfer tidak ditemukan");

  const result = await prisma.$transaction(async (tx) => {
    const transferOut = await tx.transaction.create({
      data: {
        accountId: fromAccountId,
        categoryId: transferCategory.id,
        amount,
        type: TransactionType.TRANSFER_OUT,
        description: description || "",
        date: normalizeTransactionDate(date),
      },
    });

    const transferIn = await tx.transaction.create({
      data: {
        accountId: toAccountId,
        categoryId: transferCategory.id,
        amount,
        type: TransactionType.TRANSFER_IN,
        description: description || "",
        date: normalizeTransactionDate(date),
        linkedTransferId: transferOut.id,
      },
    });

    await tx.transaction.update({
      where: { id: transferOut.id },
      data: { linkedTransferId: transferIn.id },
    });

    await tx.account.update({
      where: { id: fromAccountId },
      data: { currentBalance: { decrement: amount } },
    });

    await tx.account.update({
      where: { id: toAccountId },
      data: { currentBalance: { increment: amount } },
    });

    const updatedOut = await tx.transaction.findUnique({ where: { id: transferOut.id } });
    const updatedIn = await tx.transaction.findUnique({ where: { id: transferIn.id } });

    return { transferOut: updatedOut!, transferIn: updatedIn! };
  });

  return result;
}

export async function updateTransaction(
  id: string,
  input: Partial<AddTransactionInput>
) {
  const existing = await prisma.transaction.findUnique({
    where: { id },
    include: { account: true },
  });

  if (!existing) throw new Error("Transaksi tidak ditemukan");
  if (isTransferType(existing.type)) throw new Error("Transfer tidak bisa diedit lewat sini");

  const newAmount = input.amount ?? existing.amount;
  const newType = (input.type ?? existing.type) as TransactionType;
  const newAccountId = input.accountId ?? existing.accountId;
  const newCategoryId = input.categoryId ?? existing.categoryId;
  const newDescription = input.description ?? existing.description;
  const newDate = input.date ? normalizeTransactionDate(input.date) : existing.date;

  if (newAmount <= 0) throw new Error("Nominal harus lebih dari 0");
  if (!newCategoryId) throw new Error("Kategori wajib diisi");

  return prisma.$transaction(async (tx) => {
    // Revert old balance
    const oldChange = existing.type === TransactionType.CREDIT ? -existing.amount : existing.amount;
    await tx.account.update({
      where: { id: existing.accountId },
      data: { currentBalance: { increment: oldChange } },
    });

    const updated = await tx.transaction.update({
      where: { id },
      data: {
        accountId: newAccountId,
        categoryId: newCategoryId,
        amount: newAmount,
        type: newType,
        description: newDescription,
        date: newDate,
      },
      include: { account: true, category: true },
    });

    // Apply new balance
    const newChange = newType === TransactionType.CREDIT ? newAmount : -newAmount;
    await tx.account.update({
      where: { id: newAccountId },
      data: { currentBalance: { increment: newChange } },
    });

    return updated;
  });
}

export async function deleteTransaction(id: string) {
  const existing = await prisma.transaction.findUnique({
    where: { id },
    include: { linkedFrom: true },
  });

  if (!existing) throw new Error("Transaksi tidak ditemukan");

  if (isTransferType(existing.type)) {
    return deleteTransfer(id);
  }

  return prisma.$transaction(async (tx) => {
    const balanceChange = existing.type === TransactionType.CREDIT ? -existing.amount : existing.amount;
    await tx.account.update({
      where: { id: existing.accountId },
      data: { currentBalance: { increment: balanceChange } },
    });

    await tx.transaction.delete({ where: { id } });
    return { success: true };
  });
}

async function deleteTransfer(id: string) {
  const existing = await prisma.transaction.findUnique({
    where: { id },
  });

  if (!existing || !existing.linkedTransferId) {
    throw new Error("Transfer tidak valid");
  }

  const linkedId = existing.linkedTransferId;
  const linked = await prisma.transaction.findUnique({ where: { id: linkedId } });

  if (!linked) throw new Error("Pasangan transfer tidak ditemukan");

  return prisma.$transaction(async (tx) => {
    if (existing.type === TransactionType.TRANSFER_OUT) {
      await tx.account.update({
        where: { id: existing.accountId },
        data: { currentBalance: { increment: existing.amount } },
      });
      await tx.account.update({
        where: { id: linked.accountId },
        data: { currentBalance: { decrement: linked.amount } },
      });
    } else {
      await tx.account.update({
        where: { id: linked.accountId },
        data: { currentBalance: { increment: linked.amount } },
      });
      await tx.account.update({
        where: { id: existing.accountId },
        data: { currentBalance: { decrement: existing.amount } },
      });
    }

    await tx.transaction.deleteMany({
      where: { id: { in: [existing.id, linkedId] } },
    });

    return { success: true };
  });
}

export async function getAccounts() {
  return prisma.account.findMany({ orderBy: { name: "asc" } });
}

export async function getCategories(type?: CategoryType) {
  return prisma.category.findMany({
    where: type ? { type } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function getExpenseCategories() {
  return prisma.category.findMany({
    where: {
      type: { in: [CategoryType.DAILY_RECURRING, CategoryType.MONTHLY_FIXED, CategoryType.LIFESTYLE] },
    },
    orderBy: { name: "asc" },
  });
}

export async function getIncomeCategories() {
  return prisma.category.findMany({
    where: { type: CategoryType.INCOME },
    orderBy: { name: "asc" },
  });
}

export async function getQuickShortcuts() {
  return prisma.quickShortcut.findMany({
    include: { account: true, category: true },
    orderBy: { usageCount: "desc" },
  });
}

export async function incrementShortcutUsage(id: string) {
  return prisma.quickShortcut.update({
    where: { id },
    data: { usageCount: { increment: 1 } },
  });
}

export async function getTransactions(filters: {
  accountId?: string;
  categoryId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { accountId, categoryId, type, startDate, endDate, search, page = 1, limit = 20 } = filters;

  const where: Record<string, unknown> = {};

  if (accountId) where.accountId = accountId;
  if (categoryId) where.categoryId = categoryId;
  if (type) where.type = type;
  if (search) where.description = { contains: search };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, Date>).gte = parseAppDayStart(startDate);
    if (endDate) (where.date as Record<string, Date>).lte = parseAppDayEnd(endDate);
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getAppSettings() {
  return prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

export async function updateWeeklyGeneralBudget(amount: number | null) {
  return prisma.appSettings.upsert({
    where: { id: "default" },
    update: { weeklyGeneralBudget: amount },
    create: { id: "default", weeklyGeneralBudget: amount },
  });
}

export async function setCheckinMode(active: boolean) {
  return prisma.appSettings.upsert({
    where: { id: "default" },
    update: {
      checkinModeActive: active,
      checkinStartedAt: active ? new Date() : null,
      ...(active ? { pacaranModeActive: false, pacaranStartedAt: null } : {}),
    },
    create: {
      id: "default",
      checkinModeActive: active,
      checkinStartedAt: active ? new Date() : null,
      pacaranModeActive: false,
    },
  });
}

export async function setPacaranMode(active: boolean) {
  return prisma.appSettings.upsert({
    where: { id: "default" },
    update: {
      pacaranModeActive: active,
      pacaranStartedAt: active ? new Date() : null,
      ...(active ? { checkinModeActive: false, checkinStartedAt: null } : {}),
    },
    create: {
      id: "default",
      pacaranModeActive: active,
      pacaranStartedAt: active ? new Date() : null,
      checkinModeActive: false,
    },
  });
}

export function serializeAppSettings(settings: Awaited<ReturnType<typeof getAppSettings>>) {
  return {
    weeklyGeneralBudget: settings.weeklyGeneralBudget,
    checkinModeActive: settings.checkinModeActive,
    checkinStartedAt: settings.checkinStartedAt?.toISOString() ?? null,
    pacaranModeActive: settings.pacaranModeActive,
    pacaranStartedAt: settings.pacaranStartedAt?.toISOString() ?? null,
  };
}

async function getWeeklyGeneralSpent() {
  const { start, end } = getWeekRange();
  const spent = await prisma.transaction.aggregate({
    where: {
      type: TransactionType.DEBIT,
      date: { gte: start, lte: end },
    },
    _sum: { amount: true },
  });
  return spent._sum.amount || 0;
}

export async function getDashboardData() {
  const accounts = await getAccounts();
  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const { start: weekStart, end: weekEnd } = getWeekRange();
  const { start: monthStart, end: monthEnd } = getMonthRange();

  const settings = await getAppSettings();
  const dailyCategories = await prisma.category.findMany({
    where: { type: CategoryType.DAILY_RECURRING },
  });

  const categoryWeeklyTarget = dailyCategories.reduce((sum, c) => sum + (c.weeklyBudget || 0), 0);
  const weeklyTarget = settings.weeklyGeneralBudget ?? categoryWeeklyTarget;
  const weeklySpent = settings.weeklyGeneralBudget != null
    ? await getWeeklyGeneralSpent()
    : (await prisma.transaction.aggregate({
        where: {
          type: TransactionType.DEBIT,
          date: { gte: weekStart, lte: weekEnd },
          category: { type: CategoryType.DAILY_RECURRING },
        },
        _sum: { amount: true },
      }))._sum.amount || 0;
  const weeklyPercentage = weeklyTarget > 0 ? (weeklySpent / weeklyTarget) * 100 : 0;

  const foodCategory = await prisma.category.findFirst({
    where: { name: "Makan & Minum" },
  });

  let foodSpent = 0;
  let foodTarget = 350000;
  if (foodCategory) {
    foodTarget = foodCategory.weeklyBudget || 350000;
    const foodExpenses = await prisma.transaction.aggregate({
      where: {
        type: TransactionType.DEBIT,
        categoryId: foodCategory.id,
        date: { gte: weekStart, lte: weekEnd },
      },
      _sum: { amount: true },
    });
    foodSpent = foodExpenses._sum.amount || 0;
  }

  const foodPercentage = foodTarget > 0 ? (foodSpent / foodTarget) * 100 : 0;

  // Weekly chart - last 5 weeks
  const weeklyChart = [];
  for (let i = 4; i >= 0; i--) {
    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() - i * 7);
    const { start, end } = getWeekRange(weekDate);

    const expenses = await prisma.transaction.findMany({
      where: {
        type: TransactionType.DEBIT,
        date: { gte: start, lte: end },
        category: {
          type: { in: [CategoryType.DAILY_RECURRING, CategoryType.MONTHLY_FIXED, CategoryType.LIFESTYLE] },
        },
      },
      include: { category: true },
    });

    const categoryMap = new Map<string, { name: string; amount: number; iconName: string }>();
    for (const exp of expenses) {
      if (!exp.category) continue;
      const key = exp.category.name;
      const existing = categoryMap.get(key);
      if (existing) {
        existing.amount += exp.amount;
      } else {
        categoryMap.set(key, {
          name: exp.category.name,
          amount: exp.amount,
          iconName: exp.category.iconName,
        });
      }
    }

    weeklyChart.push({
      week: `Minggu ${5 - i}`,
      categories: Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount),
    });
  }

  // Alerts for categories > 90% weekly budget
  const alerts = [];
  for (const cat of dailyCategories) {
    if (!cat.weeklyBudget) continue;
    const spent = await prisma.transaction.aggregate({
      where: {
        type: TransactionType.DEBIT,
        categoryId: cat.id,
        date: { gte: weekStart, lte: weekEnd },
      },
      _sum: { amount: true },
    });
    const catSpent = spent._sum.amount || 0;
    const pct = (catSpent / cat.weeklyBudget) * 100;
    if (pct >= 90) {
      alerts.push({
        categoryName: cat.name,
        iconName: cat.iconName,
        percentage: Math.round(pct),
      });
    }
  }

  // Last 7 days strip (WIB)
  const last7Days = [];
  const todayKey = toAppDateString(new Date());
  const dayTotals: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const dayKey = toAppDateString(addDays(parseAppDayStart(todayKey), i - 6));
    const dayStart = parseAppDayStart(dayKey);
    const dayEnd = parseAppDayEnd(dayKey);

    const dayExpenses = await prisma.transaction.aggregate({
      where: {
        type: TransactionType.DEBIT,
        date: { gte: dayStart, lte: dayEnd },
      },
      _sum: { amount: true },
    });

    const total = dayExpenses._sum.amount || 0;
    dayTotals.push(total);
    last7Days.push({
      date: dayKey,
      total,
      isAboveAverage: false,
    });
  }

  const avg = dayTotals.reduce((a, b) => a + b, 0) / dayTotals.length;
  for (const day of last7Days) {
    day.isAboveAverage = day.total > avg;
  }

  const accountsWithChange = await Promise.all(
    accounts.map(async (account) => {
      const weeklyNet = await prisma.transaction.aggregate({
        where: {
          accountId: account.id,
          date: { gte: weekStart, lte: weekEnd },
          type: { in: [TransactionType.CREDIT, TransactionType.TRANSFER_IN] },
        },
        _sum: { amount: true },
      });
      const weeklyOut = await prisma.transaction.aggregate({
        where: {
          accountId: account.id,
          date: { gte: weekStart, lte: weekEnd },
          type: { in: [TransactionType.DEBIT, TransactionType.TRANSFER_OUT] },
        },
        _sum: { amount: true },
      });
      const weeklyChange = (weeklyNet._sum.amount || 0) - (weeklyOut._sum.amount || 0);
      return { ...account, weeklyChange };
    })
  );

  return {
    totalBalance,
    accounts: accountsWithChange,
    weeklyBudget: {
      spent: weeklySpent,
      target: weeklyTarget,
      percentage: weeklyPercentage,
    },
    foodBudget: {
      spent: foodSpent,
      target: foodTarget,
      percentage: foodPercentage,
    },
    weeklyChart,
    alerts,
    last7Days,
  };
}

export async function getCalendarData(year: number, month: number, filters?: {
  categoryId?: string;
  accountId?: string;
}) {
  const mm = String(month + 1).padStart(2, "0");
  const startStr = `${year}-${mm}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endStr = `${year}-${mm}-${String(lastDay).padStart(2, "0")}`;
  const start = parseAppDayStart(startStr);
  const end = parseAppDayEnd(endStr);

  const where: Record<string, unknown> = {
    type: TransactionType.DEBIT,
    date: { gte: start, lte: end },
  };

  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.accountId) where.accountId = filters.accountId;

  const transactions = await prisma.transaction.findMany({
    where,
    include: { account: true, category: true },
    orderBy: { date: "asc" },
  });

  const dayMap = new Map<string, { total: number; transactions: typeof transactions }>();

  for (const tx of transactions) {
    const dateKey = toAppDateString(tx.date);
    const existing = dayMap.get(dateKey);
    if (existing) {
      existing.total += tx.amount;
      existing.transactions.push(tx);
    } else {
      dayMap.set(dateKey, { total: tx.amount, transactions: [tx] });
    }
  }

  // Calculate 7-day rolling average for dot colors
  const allTotals = Array.from(dayMap.values()).map((d) => d.total);
  const avg = allTotals.length > 0 ? allTotals.reduce((a, b) => a + b, 0) / allTotals.length : 0;

  const days: Record<string, { total: number; isAboveAverage: boolean; transactions: typeof transactions }> = {};
  for (const [date, data] of Array.from(dayMap.entries())) {
    days[date] = {
      total: data.total,
      isAboveAverage: data.total > avg,
      transactions: data.transactions,
    };
  }

  return { days, avg };
}

export async function getDayTransactions(
  date: string,
  filters?: { accountId?: string; categoryId?: string }
) {
  const dayStart = parseAppDayStart(date);
  const dayEnd = parseAppDayEnd(date);

  const where: Record<string, unknown> = {
    date: { gte: dayStart, lte: dayEnd },
  };
  if (filters?.accountId) where.accountId = filters.accountId;
  if (filters?.categoryId) where.categoryId = filters.categoryId;

  const transactions = await prisma.transaction.findMany({
    where,
    include: { account: true, category: true },
    orderBy: [{ createdAt: "desc" }],
  });

  const total = transactions
    .filter((t) => t.type === TransactionType.DEBIT)
    .reduce((sum, t) => sum + t.amount, 0);

  return { transactions, total };
}

export async function getWeeklyBudgetAlerts(threshold = 90): Promise<WeeklyBudgetAlert[]> {
  const settings = await getAppSettings();
  const { start: weekStart, end: weekEnd } = getWeekRange();
  const alerts: WeeklyBudgetAlert[] = [];

  if (settings.weeklyGeneralBudget && settings.weeklyGeneralBudget > 0) {
    const spent = await getWeeklyGeneralSpent();
    const pct = (spent / settings.weeklyGeneralBudget) * 100;
    if (pct >= threshold) {
      alerts.push({
        id: "general-weekly",
        name: "Budget Umum Mingguan",
        iconName: "wallet",
        spent,
        budget: settings.weeklyGeneralBudget,
        percentage: Math.round(pct),
        kind: "general",
      });
    }
  }

  const categories = await prisma.category.findMany({
    where: {
      type: { notIn: [CategoryType.INCOME, CategoryType.TRANSFER] },
      weeklyBudget: { not: null, gt: 0 },
    },
  });

  for (const cat of categories) {
    const spent = await prisma.transaction.aggregate({
      where: {
        type: TransactionType.DEBIT,
        categoryId: cat.id,
        date: { gte: weekStart, lte: weekEnd },
      },
      _sum: { amount: true },
    });
    const total = spent._sum.amount || 0;
    const budget = cat.weeklyBudget || 0;
    const pct = budget > 0 ? (total / budget) * 100 : 0;
    if (pct >= threshold) {
      alerts.push({
        id: cat.id,
        name: cat.name,
        iconName: cat.iconName,
        spent: total,
        budget,
        percentage: Math.round(pct),
        kind: "category",
      });
    }
  }

  return alerts.sort((a, b) => b.percentage - a.percentage);
}

export async function getBudgetData() {
  const settings = await getAppSettings();
  const generalWeeklySpent = await getWeeklyGeneralSpent();
  const generalWeeklyBudget = settings.weeklyGeneralBudget || 0;

  const categories = await prisma.category.findMany({
    where: {
      type: { in: [CategoryType.DAILY_RECURRING, CategoryType.MONTHLY_FIXED, CategoryType.LIFESTYLE] },
    },
    orderBy: { name: "asc" },
  });

  const { start: monthStart, end: monthEnd } = getMonthRange();
  const { start: weekStart, end: weekEnd } = getWeekRange();
  const { start: dayStart, end: dayEnd } = getDayRange();

  const result = await Promise.all(
    categories.map(async (cat) => {
      const period = cat.budgetPeriod || BudgetPeriod.WEEKLY;
      let budget = 0;
      let rangeStart = monthStart;
      let rangeEnd = monthEnd;
      let periodLabel: "daily" | "weekly" | "monthly" = "monthly";

      if (period === BudgetPeriod.DAILY) {
        budget = cat.dailyBudget || 0;
        rangeStart = dayStart;
        rangeEnd = dayEnd;
        periodLabel = "daily";
      } else if (period === BudgetPeriod.WEEKLY) {
        budget = cat.weeklyBudget || 0;
        rangeStart = weekStart;
        rangeEnd = weekEnd;
        periodLabel = "weekly";
      } else {
        budget = cat.monthlyBudget || 0;
        periodLabel = "monthly";
      }

      const spent = await prisma.transaction.aggregate({
        where: {
          type: TransactionType.DEBIT,
          categoryId: cat.id,
          date: { gte: rangeStart, lte: rangeEnd },
        },
        _sum: { amount: true },
      });

      const spentAmount = spent._sum.amount || 0;
      const percentage = budget ? (spentAmount / budget) * 100 : 0;

      return {
        ...cat,
        spent: spentAmount,
        budget: budget || 0,
        percentage,
        period: periodLabel,
      };
    })
  );

  return {
    categories: result,
    generalWeekly: {
      budget: generalWeeklyBudget,
      spent: generalWeeklySpent,
      percentage: generalWeeklyBudget > 0 ? (generalWeeklySpent / generalWeeklyBudget) * 100 : 0,
    },
  };
}

export async function updateCategoryBudget(
  id: string,
  data: {
    dailyBudget?: number | null;
    weeklyBudget?: number | null;
    monthlyBudget?: number | null;
    budgetPeriod?: string;
  }
) {
  return prisma.category.update({
    where: { id },
    data,
  });
}

export async function createCategory(data: {
  name: string;
  emoji?: string;
  iconName?: string;
  type: CategoryType;
  budgetPeriod?: string;
  dailyBudget?: number | null;
  weeklyBudget?: number | null;
  monthlyBudget?: number | null;
}) {
  const budgetPeriod =
    data.budgetPeriod ||
    (data.type === CategoryType.DAILY_RECURRING ? BudgetPeriod.WEEKLY : BudgetPeriod.MONTHLY);

  return prisma.category.create({
    data: {
      name: data.name,
      emoji: "",
      iconName: data.iconName || "circle-dollar-sign",
      type: data.type,
      budgetPeriod,
      dailyBudget: data.dailyBudget,
      weeklyBudget: data.weeklyBudget,
      monthlyBudget: data.monthlyBudget,
    },
  });
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new Error("Kategori tidak ditemukan");
  if (category.type === CategoryType.INCOME || category.type === CategoryType.TRANSFER) {
    throw new Error("Kategori sistem tidak bisa dihapus");
  }
  return prisma.category.delete({ where: { id } });
}

export async function getReportData(filters: {
  accountId?: string;
  startDate?: string;
  endDate?: string;
  period?: "weekly" | "monthly";
}) {
  const { accountId, startDate, endDate, period = "monthly" } = filters;

  const start = startDate ? parseAppDayStart(startDate) : getMonthRange().start;
  const end = endDate ? parseAppDayEnd(endDate) : getMonthRange().end;

  const where: Record<string, unknown> = {
    date: { gte: start, lte: end },
  };
  if (accountId) where.accountId = accountId;

  const transactions = await prisma.transaction.findMany({
    where,
    include: { account: true, category: true },
    orderBy: { date: "asc" },
  });

  const expenses = transactions.filter((t) => t.type === TransactionType.DEBIT);
  const incomes = transactions.filter((t) => t.type === TransactionType.CREDIT);

  const categoryBreakdown = new Map<string, { name: string; iconName: string; amount: number }>();
  for (const exp of expenses) {
    if (!exp.category) continue;
    const key = exp.category.name;
    const existing = categoryBreakdown.get(key);
    if (existing) {
      existing.amount += exp.amount;
    } else {
      categoryBreakdown.set(key, {
        name: exp.category.name,
        iconName: exp.category.iconName,
        amount: exp.amount,
      });
    }
  }

  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);

  const checkinExpenses = expenses.filter((t) => t.isCheckin);
  const pacaranExpenses = expenses.filter((t) => t.isPacaran);
  const checkinBreakdown = new Map<string, { name: string; iconName: string; amount: number }>();
  const pacaranBreakdown = new Map<string, { name: string; iconName: string; amount: number }>();
  for (const exp of checkinExpenses) {
    if (!exp.category) continue;
    const key = exp.category.name;
    const existing = checkinBreakdown.get(key);
    if (existing) existing.amount += exp.amount;
    else {
      checkinBreakdown.set(key, {
        name: exp.category.name,
        iconName: exp.category.iconName,
        amount: exp.amount,
      });
    }
  }
  for (const exp of pacaranExpenses) {
    if (!exp.category) continue;
    const key = exp.category.name;
    const existing = pacaranBreakdown.get(key);
    if (existing) existing.amount += exp.amount;
    else {
      pacaranBreakdown.set(key, {
        name: exp.category.name,
        iconName: exp.category.iconName,
        amount: exp.amount,
      });
    }
  }
  const settings = await getAppSettings();

  // Monthly or weekly income vs outcome comparison
  const monthlyComparison = [];
  const weeklyComparison = [];

  if (period === "weekly") {
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const { start: wStart, end: wEnd } = getWeekRange(d);

      const weekWhere: Record<string, unknown> = {
        date: { gte: wStart, lte: wEnd },
      };
      if (accountId) weekWhere.accountId = accountId;

      const weekTx = await prisma.transaction.findMany({ where: weekWhere });

      const income = weekTx
        .filter((t) => t.type === TransactionType.CREDIT)
        .reduce((sum, t) => sum + t.amount, 0);
      const outcome = weekTx
        .filter((t) => t.type === TransactionType.DEBIT)
        .reduce((sum, t) => sum + t.amount, 0);

      weeklyComparison.push({
        week: `${format(wStart, "d MMM")}–${format(wEnd, "d MMM")}`,
        income,
        outcome,
      });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const { start: mStart, end: mEnd } = getMonthRange(d);

      const monthWhere: Record<string, unknown> = {
        date: { gte: mStart, lte: mEnd },
      };
      if (accountId) monthWhere.accountId = accountId;

      const monthTx = await prisma.transaction.findMany({ where: monthWhere });

      const income = monthTx
        .filter((t) => t.type === TransactionType.CREDIT)
        .reduce((sum, t) => sum + t.amount, 0);
      const outcome = monthTx
        .filter((t) => t.type === TransactionType.DEBIT)
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyComparison.push({
        month: format(d, "MMM yyyy"),
        income,
        outcome,
      });
    }
  }

  return {
    categoryBreakdown: Array.from(categoryBreakdown.values()).sort((a, b) => b.amount - a.amount),
    totalExpense,
    totalIncome,
    monthlyComparison,
    weeklyComparison,
    transactions,
    period,
    checkin: {
      totalExpense: checkinExpenses.reduce((sum, t) => sum + t.amount, 0),
      transactionCount: checkinExpenses.length,
      categoryBreakdown: Array.from(checkinBreakdown.values()).sort((a, b) => b.amount - a.amount),
      transactions: [...checkinExpenses]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map((t) => ({
          ...t,
          account: t.account,
          category: t.category,
        })),
      sessionStartedAt: settings.checkinStartedAt?.toISOString() ?? null,
      modeActive: settings.checkinModeActive,
    },
    pacaran: {
      totalExpense: pacaranExpenses.reduce((sum, t) => sum + t.amount, 0),
      transactionCount: pacaranExpenses.length,
      categoryBreakdown: Array.from(pacaranBreakdown.values()).sort((a, b) => b.amount - a.amount),
      transactions: [...pacaranExpenses]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map((t) => ({
          ...t,
          account: t.account,
          category: t.category,
        })),
      sessionStartedAt: settings.pacaranStartedAt?.toISOString() ?? null,
      modeActive: settings.pacaranModeActive,
    },
  };
}

function format(d: Date, fmt: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  if (fmt === "MMM yyyy") return `${months[d.getMonth()]} ${d.getFullYear()}`;
  if (fmt === "d MMM") return `${d.getDate()} ${months[d.getMonth()]}`;
  return d.toISOString();
}

export async function exportTransactionsCSV(filters: {
  accountId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { accountId, startDate, endDate } = filters;

  const where: Record<string, unknown> = {};
  if (accountId) where.accountId = accountId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, Date>).gte = parseAppDayStart(startDate);
    if (endDate) (where.date as Record<string, Date>).lte = parseAppDayEnd(endDate);
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { account: true, category: true },
    orderBy: { date: "asc" },
  });

  const header = "Tanggal,Akun,Kategori,Tipe,Nominal,Deskripsi\n";
  const rows = transactions.map((t) => {
    const date = toAppDateString(t.date);
    const account = t.account.name;
    const category = t.category?.name || "";
    const type = t.type;
    const amount = t.amount;
    const desc = (t.description || "").replace(/"/g, '""');
    return `${date},${account},${category},${type},${amount},"${desc}"`;
  });

  return header + rows.join("\n");
}

// Shortcut CRUD
export async function createShortcut(data: {
  label: string;
  accountId: string;
  categoryId: string;
  defaultAmount?: number | null;
  iconName?: string;
}) {
  return prisma.quickShortcut.create({
    data: {
      label: data.label,
      accountId: data.accountId,
      categoryId: data.categoryId,
      defaultAmount: data.defaultAmount,
      emoji: "",
      iconName: data.iconName || "zap",
    },
    include: { account: true, category: true },
  });
}

export async function updateShortcut(
  id: string,
  data: Partial<{
    label: string;
    accountId: string;
    categoryId: string;
    defaultAmount: number | null;
    iconName: string;
  }>
) {
  return prisma.quickShortcut.update({
    where: { id },
    data,
    include: { account: true, category: true },
  });
}

export async function deleteShortcut(id: string) {
  return prisma.quickShortcut.delete({ where: { id } });
}

export async function getCategoryUsageCounts() {
  const counts = await prisma.transaction.groupBy({
    by: ["categoryId"],
    _count: { categoryId: true },
    where: { categoryId: { not: null } },
  });
  const map = new Map<string, number>();
  for (const c of counts) {
    if (c.categoryId) map.set(c.categoryId, c._count.categoryId);
  }
  return map;
}
