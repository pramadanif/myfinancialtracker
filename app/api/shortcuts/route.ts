import { NextRequest, NextResponse } from "next/server";
import { createShortcut, getQuickShortcuts } from "@/lib/transactions";

export const dynamic = "force-dynamic";

const noStore = { headers: { "Cache-Control": "no-store" } };

export async function GET() {
  const shortcuts = await getQuickShortcuts();
  return NextResponse.json(shortcuts, noStore);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const shortcut = await createShortcut(body);
    return NextResponse.json(shortcut, noStore);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat shortcut";
    return NextResponse.json({ error: message }, { status: 400, ...noStore });
  }
}
