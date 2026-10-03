import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

// Optimistic cookie-presence redirect for UX. This is not the sole guard:
// each protected layout/page also calls getCurrentUser() server-side
// (see app/(app)/layout.tsx), since a matcher change here could otherwise
// silently stop protecting a route.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/goals/:path*",
    "/calendar/:path*",
    "/onboarding/:path*",
    "/tasks/:path*",
    "/alarm/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/veilleur/goal/:path*",
  ],
};
