export const CategoryType = {
  DAILY_RECURRING: "DAILY_RECURRING",
  MONTHLY_FIXED: "MONTHLY_FIXED",
  LIFESTYLE: "LIFESTYLE",
  INCOME: "INCOME",
  TRANSFER: "TRANSFER",
} as const;

export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];

export const TransactionType = {
  DEBIT: "DEBIT",
  CREDIT: "CREDIT",
  TRANSFER_OUT: "TRANSFER_OUT",
  TRANSFER_IN: "TRANSFER_IN",
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const BudgetPeriod = {
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
} as const;

export type BudgetPeriod = (typeof BudgetPeriod)[keyof typeof BudgetPeriod];

export const ShortcutFrequency = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
} as const;

export type ShortcutFrequency = (typeof ShortcutFrequency)[keyof typeof ShortcutFrequency];
