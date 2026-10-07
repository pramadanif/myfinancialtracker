import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRelyingParty } from "@/lib/passkey";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getSession();
  const expectedChallenge = session.challenge;
  if (!expectedChallenge) {
    return NextResponse.json({ error: "Sesi verifikasi kedaluwarsa" }, { status: 400 });
  }
  session.challenge = undefined;
  await session.save();

  const body = await request.json();
  const credential = await prisma.passkeyCredential.findUnique({ where: { id: body?.response?.id } });
  if (!credential) {
    return NextResponse.json({ error: "Perangkat tidak dikenal" }, { status: 401 });
  }

  const { rpID, origin } = getRelyingParty(request);
  try {
    const verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: credential.id,
        publicKey: new Uint8Array(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports
          ? (credential.transports.split(",") as AuthenticatorTransportFuture[])
          : undefined,
      },
    });
    if (!verification.verified) {
      return NextResponse.json({ error: "Verifikasi gagal" }, { status: 401 });
    }

    await prisma.passkeyCredential.update({
      where: { id: credential.id },
      data: { counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() },
    });

    session.isLoggedIn = true;
    session.lastSeen = Date.now();
    await session.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verifikasi gagal" },
      { status: 401 }
    );
  }
}
