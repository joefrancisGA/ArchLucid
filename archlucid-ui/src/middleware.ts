import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { decideHostGateRedirect } from "@/lib/host-gate";

/**
 * TB-2019 — when ARCHLUCID_PUBLIC_SITE_URL and ARCHLUCID_APP_SITE_URL differ, keep marketing
 * paths on the apex host and operator paths on app.<domain>. No-op for local single-host dev.
 */
export function middleware(request: NextRequest): NextResponse {
  const decision = decideHostGateRedirect({
    hostHeader: request.headers.get("host"),
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
  });

  if (decision.kind === "redirect") {
    return NextResponse.redirect(decision.location, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Skip Next internals and common static assets — host gating only applies to HTML/app routes.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)",
  ],
};
