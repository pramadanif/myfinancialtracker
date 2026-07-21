import { NextRequest, NextResponse } from "next/server";
import { createShortcut, getQuickShortcuts } from "@/lib/transactions";

export async function GET() {
  const shortcuts = await getQuickShortcuts();
  return NextResponse.json(shortcuts);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const shortcut = await createShortcut(body);
    return NextResponse.json(shortcut);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat shortcut";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
