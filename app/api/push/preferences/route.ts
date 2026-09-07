import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let prefs = await prisma.notificationPreference.findUnique({ where: { id: "default" } });
  if (!prefs) {
    prefs = await prisma.notificationPreference.create({ data: { id: "default" } });
  }
  const hasSubscription = (await prisma.pushSubscription.count()) > 0;
  return NextResponse.json({ ...prefs, hasSubscription });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (typeof body.dailyReminder === "boolean") data.dailyReminder = body.dailyReminder;
  if (typeof body.dailyReminderHour === "number") data.dailyReminderHour = body.dailyReminderHour;
  if (typeof body.budgetAlert === "boolean") data.budgetAlert = body.budgetAlert;
  if (typeof body.weeklySummary === "boolean") data.weeklySummary = body.weeklySummary;
  if (typeof body.weeklySummaryDay === "number") data.weeklySummaryDay = body.weeklySummaryDay;
  if (typeof body.weeklySummaryHour === "number") data.weeklySummaryHour = body.weeklySummaryHour;

  const prefs = await prisma.notificationPreference.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });

  return NextResponse.json(prefs);
}
