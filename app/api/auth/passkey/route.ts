import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const credentials = await prisma.passkeyCredential.findMany({
    select: { id: true, deviceName: true, createdAt: true, lastUsedAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(credentials, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) await prisma.passkeyCredential.delete({ where: { id } }).catch(() => null);
  else await prisma.passkeyCredential.deleteMany();
  return NextResponse.json({ success: true });
}
