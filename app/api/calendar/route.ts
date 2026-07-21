import { NextRequest, NextResponse } from "next/server";
import { getCalendarData, getDayTransactions } from "@/lib/transactions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth()), 10);
  const categoryId = searchParams.get("categoryId") || undefined;
  const accountId = searchParams.get("accountId") || undefined;
  const date = searchParams.get("date");

  if (date) {
    const dayData = await getDayTransactions(date);
    return NextResponse.json(dayData);
  }

  const data = await getCalendarData(year, month, { categoryId, accountId });
  return NextResponse.json(data);
}
