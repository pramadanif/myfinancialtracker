import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const count = await prisma.passkeyCredential.count();
  return NextResponse.json({ enabled: count > 0 }, { headers: { "Cache-Control": "no-store" } });
}
