import { NextResponse } from "next/server";
import {
  getAccounts,
  getExpenseCategories,
  getIncomeCategories,
  getQuickShortcuts,
  getCategoryUsageCounts,
} from "@/lib/transactions";

export async function GET() {
  const [accounts, expenseCategories, incomeCategories, shortcuts, usageCounts] =
    await Promise.all([
      getAccounts(),
      getExpenseCategories(),
      getIncomeCategories(),
      getQuickShortcuts(),
      getCategoryUsageCounts(),
    ]);

  const withUsage = (cats: typeof expenseCategories) =>
    cats.map((c) => ({
      ...c,
      usageCount: usageCounts.get(c.id) || 0,
    }));

  return NextResponse.json({
    accounts,
    expenseCategories: withUsage(expenseCategories),
    incomeCategories: withUsage(incomeCategories),
    shortcuts,
  });
}
