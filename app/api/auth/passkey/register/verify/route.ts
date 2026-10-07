import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRelyingParty } from "@/lib/passkey";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.challenge) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rpID, origin } = getRelyingParty(request);
  const body = await request.json();
  const expectedChallenge = session.challenge;
  session.challenge = undefined;
  await session.save();

  try {
    const verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
    if (!verification.verified) {
      return NextResponse.json({ error: "Verifikasi gagal" }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;
    await prisma.passkeyCredential.upsert({
      where: { id: credential.id },
      update: { publicKey: Buffer.from(credential.publicKey), counter: credential.counter },
      create: {
        id: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        transports: (credential.transports ?? []).join(","),
        deviceName: typeof body.deviceName === "string" ? body.deviceName.slice(0, 60) : "",
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verifikasi gagal" },
      { status: 400 }
    );
  }
}
