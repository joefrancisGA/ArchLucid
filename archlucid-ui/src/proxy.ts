import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { demoRunAliasRedirectDestinationPath } from "@/lib/demo-run-alias-path-redirect";
import { findingEvidenceTraceLegacyRedirectPath } from "@/lib/finding-evidence-navigation";
import { sponsorReportLegacyRedirectPath } from "@/lib/sponsor-report-navigation";

/**
 * Next.js proxy (formerly "middleware"): demo run id aliases (bookmark slugs → canonical showcase id) MUST
 * preserve pathname tails (`/findings/.../evidence-trace`, `/provenance`, …). Matching logic also lives alongside
 * {@link canonicalizeDemoRunId}.
 */
export function proxy(request: NextRequest) {
  const legacySponsorReport = sponsorReportLegacyRedirectPath(request.nextUrl.pathname);

  if (legacySponsorReport !== null) {
    const u = request.nextUrl.clone();

    u.pathname = legacySponsorReport;

    return NextResponse.redirect(u, 308);
  }

  const legacyEvidenceTrace = findingEvidenceTraceLegacyRedirectPath(request.nextUrl.pathname);

  if (legacyEvidenceTrace !== null) {
    const u = request.nextUrl.clone();

    u.pathname = legacyEvidenceTrace;

    return NextResponse.redirect(u, 308);
  }

  const nextPath = demoRunAliasRedirectDestinationPath(request.nextUrl.pathname);

  if (nextPath !== null) {
    const u = request.nextUrl.clone();

    u.pathname = nextPath;

    return NextResponse.redirect(u, 308);
  }

  if (request.nextUrl.pathname === "/403") {
    return NextResponse.next({ status: 403 });
  }

  return NextResponse.next();
}

/** Routes that pass through this proxy (authority, artifact, and comparison flows). */
export const config = {
  matcher: [
    "/403",
    "/value-report",
    "/value-report/:path*",
    "/scorecard",
    "/scorecard/:path*",
    "/sponsor-report",
    "/sponsor-report/:path*",
    "/reviews/:path*",
    "/executive/scorecard",
    "/runs/:path*",
    "/compare",
    "/replay",
    "/manifests/:path*",
    "/signed-records/:path*",
  ],
};
