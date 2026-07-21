import { NextRequest, NextResponse } from "next/server";
import { createTransfer } from "@/lib/transactions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createTransfer(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan transfer";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
