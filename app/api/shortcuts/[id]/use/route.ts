import { NextResponse } from "next/server";
import { incrementShortcutUsage } from "@/lib/transactions";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await incrementShortcutUsage(params.id);
  return NextResponse.json({ success: true });
}
