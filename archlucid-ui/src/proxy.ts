import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { demoRunAliasRedirectDestinationPath } from "@/lib/demo-run-alias-path-redirect";
import { decideHostGateRedirect } from "@/lib/host-gate";
import { ARCHLUCID_PATHNAME_REQUEST_HEADER } from "@/lib/product-line/securenow-marketing-route-policy";

function proxyNext(request: NextRequest, init?: ResponseInit): NextResponse {
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set(ARCHLUCID_PATHNAME_REQUEST_HEADER, request.nextUrl.pathname);

  return NextResponse.next({ ...init, request: { headers: requestHeaders } });
}

/**
 * Next.js proxy (formerly "middleware"): host gating (TB-2019) and demo run id aliases.
 */
export function proxy(request: NextRequest) {
  const hostGate = decideHostGateRedirect({
    hostHeader: request.headers.get("host"),
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
  });

  if (hostGate.kind === "redirect") {
    return NextResponse.redirect(hostGate.location, 307);
  }

  const nextPath = demoRunAliasRedirectDestinationPath(request.nextUrl.pathname);

  if (nextPath !== null) {
    const u = request.nextUrl.clone();

    u.pathname = nextPath;

    return NextResponse.redirect(u, 308);
  }

  if (request.nextUrl.pathname === "/403") {
    return proxyNext(request, { status: 403 });
  }

  return proxyNext(request);
}

/** Routes that pass through this proxy (host gate + authority, artifact, and comparison flows). */
export const config = {
  matcher: [
    "/api/proxy/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)",
  ],
};
