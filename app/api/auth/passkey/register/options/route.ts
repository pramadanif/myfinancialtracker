import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRelyingParty, RP_NAME, PASSKEY_USER_ID } from "@/lib/passkey";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rpID } = getRelyingParty(request);
  const existing = await prisma.passkeyCredential.findMany({ select: { id: true } });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: "Pemilik",
    userID: PASSKEY_USER_ID,
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({ id: c.id })),
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "required",
    },
  });

  session.challenge = options.challenge;
  await session.save();
  return NextResponse.json(options);
}
