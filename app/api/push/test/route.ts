import { NextResponse } from "next/server";
import { sendTestNotification } from "@/lib/notifications";
import { getVapidPublicKey } from "@/lib/push";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!getVapidPublicKey()) {
    return NextResponse.json(
      { error: "VAPID keys belum dikonfigurasi di server" },
      { status: 503 }
    );
  }

  const subCount = await prisma.pushSubscription.count();
  if (subCount === 0) {
    return NextResponse.json(
      { error: "Belum ada perangkat terdaftar. Aktifkan notifikasi dulu." },
      { status: 400 }
    );
  }

  try {
    const result = await sendTestNotification();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengirim notifikasi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
