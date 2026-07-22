import { NextRequest, NextResponse } from "next/server";
import { getBudgetData, updateCategoryBudget, createCategory } from "@/lib/transactions";
import { CategoryType } from "@/types/enums";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getBudgetData();
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  try {
    const { id, dailyBudget, weeklyBudget, monthlyBudget, budgetPeriod } = await request.json();
    const category = await updateCategoryBudget(id, { dailyBudget, weeklyBudget, monthlyBudget, budgetPeriod });
    return NextResponse.json(category);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengupdate budget";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const category = await createCategory({
      name: body.name,
      iconName: body.iconName,
      type: body.type as CategoryType,
      budgetPeriod: body.budgetPeriod,
      dailyBudget: body.dailyBudget,
      weeklyBudget: body.weeklyBudget,
      monthlyBudget: body.monthlyBudget,
    });
    return NextResponse.json(category);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat kategori";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
