import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { demoRunAliasRedirectDestinationPath } from "@/lib/demo-run-alias-path-redirect";

/**
 * Next.js proxy (formerly "middleware"): demo run id aliases (bookmark slugs → canonical showcase id) MUST
 * preserve pathname tails (`/findings/.../inspect`, `/provenance`, …). Matching logic also lives alongside
 * {@link canonicalizeDemoRunId}.
 */
export function proxy(request: NextRequest) {
  const nextPath = demoRunAliasRedirectDestinationPath(request.nextUrl.pathname);

  if (nextPath !== null) {
    const u = request.nextUrl.clone();

    u.pathname = nextPath;

    return NextResponse.redirect(u, 308);
  }

  if (request.nextUrl.pathname === "/403") {
    const response = NextResponse.next();

    response.status = 403;

    return response;
  }

  return NextResponse.next();
}

/** Routes that pass through this proxy (authority, artifact, and comparison flows). */
export const config = {
  matcher: [
    "/403",
    "/reviews/:path*",
    "/executive/reviews/:path*",
    "/executive/scorecard",
    "/runs/:path*",
    "/compare",
    "/replay",
    "/manifests/:path*",
    "/signed-records/:path*",
  ],
};
