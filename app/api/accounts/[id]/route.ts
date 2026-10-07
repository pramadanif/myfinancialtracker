import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.excludeFromTotal !== "boolean") {
    return NextResponse.json({ error: "excludeFromTotal harus boolean" }, { status: 400 });
  }

  const account = await prisma.account.update({
    where: { id: params.id },
    data: { excludeFromTotal: body.excludeFromTotal },
  });
  return NextResponse.json(account, { headers: { "Cache-Control": "no-store" } });
}
