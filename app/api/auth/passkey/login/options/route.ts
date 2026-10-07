import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRelyingParty } from "@/lib/passkey";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const credentials = await prisma.passkeyCredential.findMany();
  if (credentials.length === 0) {
    return NextResponse.json({ error: "Face ID belum diaktifkan" }, { status: 404 });
  }

  const { rpID } = getRelyingParty(request);
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: credentials.map((c) => ({
      id: c.id,
      transports: c.transports
        ? (c.transports.split(",") as AuthenticatorTransportFuture[])
        : undefined,
    })),
  });

  const session = await getSession();
  session.challenge = options.challenge;
  await session.save();
  return NextResponse.json(options);
}
