import type { Account, Category, Transaction, QuickShortcut } from "@prisma/client";

export type AccountWithBalance = Account;

export type CategoryWithUsage = Category & {
  spent?: number;
  budget?: number;
  percentage?: number;
  usageCount?: number;
  period?: "daily" | "weekly" | "monthly";
};

export type WeeklyBudgetAlert = {
  id: string;
  name: string;
  iconName: string;
  spent: number;
  budget: number;
  percentage: number;
  kind: "general" | "category";
};

export type GeneralWeeklyBudget = {
  budget: number;
  spent: number;
  percentage: number;
};

export type BudgetData = {
  categories: CategoryWithUsage[];
  generalWeekly: GeneralWeeklyBudget;
};

export type TransactionWithRelations = Transaction & {
  account: Account;
  category: Category | null;
};

export type QuickShortcutWithRelations = QuickShortcut & {
  account: Account;
  category: Category;
};

export type AccountWithChange = Account & {
  weeklyChange?: number;
};

export type DashboardData = {
  totalBalance: number;
  accounts: AccountWithChange[];
  weeklyBudget: {
    spent: number;
    target: number;
    percentage: number;
  };
  foodBudget: {
    spent: number;
    target: number;
    percentage: number;
  };
  weeklyChart: {
    week: string;
    categories: { name: string; amount: number; iconName: string }[];
  }[];
  alerts: { categoryName: string; iconName: string; percentage: number }[];
  last7Days: { date: string; total: number; isAboveAverage: boolean }[];
};

export type TransactionFilters = {
  accountId?: string;
  categoryId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type CalendarDayData = {
  date: string;
  total: number;
  isAboveAverage: boolean;
  transactions: TransactionWithRelations[];
};

export type ReportFilters = {
  accountId?: string;
  startDate?: string;
  endDate?: string;
  period?: "weekly" | "monthly";
};

export type AddTransactionInput = {
  accountId: string;
  categoryId?: string;
  amount: number;
  type: "DEBIT" | "CREDIT";
  description?: string;
  date: string;
  isCheckin?: boolean;
  isPacaran?: boolean;
};

export type AppSettingsData = {
  weeklyGeneralBudget: number | null;
  checkinModeActive: boolean;
  checkinStartedAt: string | null;
  pacaranModeActive: boolean;
  pacaranStartedAt: string | null;
};

export type ModeReportData = {
  totalExpense: number;
  transactionCount: number;
  categoryBreakdown: { name: string; iconName: string; amount: number }[];
  transactions: TransactionWithRelations[];
  sessionStartedAt: string | null;
};

export type CheckinReportData = ModeReportData;
export type PacaranReportData = ModeReportData;

export type TransferInput = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  date: string;
};
