import { NextRequest, NextResponse } from "next/server";
import { getBudgetData, updateCategoryBudget, createCategory, updateWeeklyGeneralBudget } from "@/lib/transactions";
import { CategoryType } from "@/types/enums";

export const dynamic = "force-dynamic";

const noStore = { headers: { "Cache-Control": "no-store" } };

export async function GET() {
  const data = await getBudgetData();
  return NextResponse.json(data, noStore);
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.weeklyGeneralBudget !== undefined) {
      const value = body.weeklyGeneralBudget === null || body.weeklyGeneralBudget === ""
        ? null
        : Number(body.weeklyGeneralBudget);
      if (value !== null && (isNaN(value) || value < 0)) {
        return NextResponse.json({ error: "Nominal tidak valid" }, { status: 400, ...noStore });
      }
      await updateWeeklyGeneralBudget(value);
      const data = await getBudgetData();
      return NextResponse.json(data, noStore);
    }

    const { id, dailyBudget, weeklyBudget, monthlyBudget, budgetPeriod } = body;
    const category = await updateCategoryBudget(id, { dailyBudget, weeklyBudget, monthlyBudget, budgetPeriod });
    return NextResponse.json(category, noStore);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengupdate budget";
    return NextResponse.json({ error: message }, { status: 400, ...noStore });
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
    return NextResponse.json(category, noStore);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat kategori";
    return NextResponse.json({ error: message }, { status: 400, ...noStore });
  }
}
