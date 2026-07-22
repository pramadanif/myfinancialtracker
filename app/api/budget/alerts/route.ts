import { NextResponse } from "next/server";
import { getWeeklyBudgetAlerts } from "@/lib/transactions";

export const dynamic = "force-dynamic";

const noStore = { headers: { "Cache-Control": "no-store" } };

export async function GET() {
  const alerts = await getWeeklyBudgetAlerts(90);
  return NextResponse.json({ alerts }, noStore);
}
