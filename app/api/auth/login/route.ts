import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getSession } from "@/lib/auth";

function verifyPin(input: string, expected: string): boolean {
  if (input.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  const { pin } = await request.json();
  const appPin = process.env.APP_PIN || process.env.APP_PASSWORD || "123456";

  if (!pin || typeof pin !== "string" || !verifyPin(pin, appPin)) {
    return NextResponse.json({ error: "PIN salah" }, { status: 401 });
  }

  const session = await getSession();
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ success: true });
}
