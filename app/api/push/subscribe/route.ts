import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVapidPublicKey } from "@/lib/push";

export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json({ error: "Push notifications belum dikonfigurasi" }, { status: 503 });
  }
  return NextResponse.json({ publicKey });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Subscription tidak valid" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { p256dh: keys.p256dh, auth: keys.auth },
  });

  await prisma.notificationPreference.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  if (body?.endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint } });
  }
  return NextResponse.json({ ok: true });
}
