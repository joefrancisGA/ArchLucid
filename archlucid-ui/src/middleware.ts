import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { demoRunAliasRedirectDestinationPath } from "@/lib/demo-run-alias-path-redirect";

/**
 * Next.js middleware: demo run id aliases (bookmark slugs → canonical showcase id) MUST preserve pathname tails
 * (`/findings/.../inspect`, `/provenance`, …). Matching logic also lives alongside {@link canonicalizeDemoRunId}.
 */
export function middleware(request: NextRequest) {
  const nextPath = demoRunAliasRedirectDestinationPath(request.nextUrl.pathname);

  if (nextPath !== null) {
    const u = request.nextUrl.clone();

    u.pathname = nextPath;

    return NextResponse.redirect(u, 308);
  }

  return NextResponse.next();
}

/** Routes that pass through this middleware (authority, artifact, and comparison flows). */
export const config = {
  matcher: [
    "/reviews/:path*",
    "/executive/reviews/:path*",
    "/executive/scorecard",
    "/runs/:path*",
    "/compare",
    "/replay",
    "/manifests/:path*",
  ],
};
