import { NextRequest, NextResponse } from "next/server";
import { createTransaction } from "@/lib/transactions";

export const dynamic = "force-dynamic";

const noStore = { headers: { "Cache-Control": "no-store" } };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transaction = await createTransaction(body);
    return NextResponse.json(transaction, noStore);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan transaksi";
    return NextResponse.json({ error: message }, { status: 400, ...noStore });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const { getTransactions } = await import("@/lib/transactions");

  const filters = {
    accountId: searchParams.get("accountId") || undefined,
    categoryId: searchParams.get("categoryId") || undefined,
    type: searchParams.get("type") || undefined,
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    search: searchParams.get("search") || undefined,
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "20", 10),
  };

  const result = await getTransactions(filters);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
