import { NextResponse } from "next/server";
import { getAccounts } from "@/lib/transactions";

export const dynamic = "force-dynamic";

export async function GET() {
  const accounts = await getAccounts();
  return NextResponse.json(accounts, {
    headers: { "Cache-Control": "no-store" },
  });
}
