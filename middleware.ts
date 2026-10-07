import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, IDLE_LOCK_MS } from "@/lib/auth";
import { SessionData } from "@/types/session";

const publicPaths = [
  "/login",
  "/api/auth/login",
  "/api/auth/passkey/login",
  "/api/auth/passkey/status",
  "/api/cron/notifications",
];
const LAST_SEEN_REFRESH_MS = 30 * 1000;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/splash/") ||
    pathname === "/apple-touch-icon.png" ||
    pathname === "/offline"
  ) {
    if (pathname === "/login") {
      const response = NextResponse.next();
      const session = await getIronSession<SessionData>(request, response, sessionOptions);
      if (session.isLoggedIn && session.lastSeen && Date.now() - session.lastSeen <= IDLE_LOCK_MS) {
        return NextResponse.redirect(new URL("/transactions", request.url));
      }
    }
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  const now = Date.now();
  const idleExpired = session.isLoggedIn && (!session.lastSeen || now - session.lastSeen > IDLE_LOCK_MS);

  if (!session.isLoggedIn || idleExpired) {
    const denied = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));
    if (idleExpired) {
      const lockedSession = await getIronSession<SessionData>(request, denied, sessionOptions);
      lockedSession.isLoggedIn = false;
      lockedSession.lastSeen = undefined;
      await lockedSession.save();
    }
    return denied;
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/transactions", request.url));
  }

  if (now - session.lastSeen! > LAST_SEEN_REFRESH_MS) {
    session.lastSeen = now;
    await session.save();
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|splash|sw.js|manifest.webmanifest|apple-touch-icon.png).*)"],
};
