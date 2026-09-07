import { NextResponse } from "next/server";
import { runAllNotificationChecks } from "@/lib/notifications";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  return Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await runAllNotificationChecks();
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Vercel Cron memanggil endpoint via GET dengan header Authorization: Bearer $CRON_SECRET
export const GET = handle;
// Cron eksternal (cron-job.org, dll) memanggil via POST dengan header yang sama
export const POST = handle;
