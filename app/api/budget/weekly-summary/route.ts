import { NextResponse } from "next/server";
import { getWeeklyBudgetSummary } from "@/lib/transactions";

export const dynamic = "force-dynamic";

export async function GET() {
  const summary = await getWeeklyBudgetSummary();
  return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } });
}
