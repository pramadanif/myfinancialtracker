import type { NextRequest } from "next/server";

export const RP_NAME = "Finance Tracker";
export const PASSKEY_USER_ID = new TextEncoder().encode("finance-owner");

export function getRelyingParty(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || request.nextUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "");
  const rpID = host.split(":")[0];
  const origin = request.headers.get("origin") || `${proto}://${host}`;
  return { rpID, origin };
}
