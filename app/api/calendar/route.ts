import { NextRequest, NextResponse } from "next/server";
import { getCalendarData, getDayTransactions } from "@/lib/transactions";
import { getAppTimeParts } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nowParts = getAppTimeParts();
  const [defaultYear, defaultMonth] = nowParts.dateKey.split("-").map(Number);
  const year = parseInt(searchParams.get("year") || String(defaultYear), 10);
  const month = parseInt(searchParams.get("month") || String(defaultMonth - 1), 10);
  const categoryId = searchParams.get("categoryId") || undefined;
  const accountId = searchParams.get("accountId") || undefined;
  const date = searchParams.get("date");

  if (date) {
    const dayData = await getDayTransactions(date, { categoryId, accountId });
    return NextResponse.json(dayData, { headers: { "Cache-Control": "no-store" } });
  }

  const data = await getCalendarData(year, month, { categoryId, accountId });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
