import { NextRequest, NextResponse } from "next/server";
import { getReportData, exportTransactionsCSV } from "@/lib/transactions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  const filters = {
    accountId: searchParams.get("accountId") || undefined,
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    period: (searchParams.get("period") as "weekly" | "monthly") || "monthly",
  };

  if (format === "csv") {
    const csv = await exportTransactionsCSV(filters);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transaksi-${filters.startDate || "all"}-${filters.endDate || "all"}.csv"`,
      },
    });
  }

  const data = await getReportData(filters);
  return NextResponse.json(data);
}
