import { canonicalizeDemoRunId, demoRunUrlRequiresCanonicalRedirect } from "@/lib/demo-run-canonical";

/**
 * When a URL uses a known demo run id alias (see {@link canonicalizeDemoRunId}), return the same path with the
 * canonical run segment and **all trailing segments preserved** (findings, inspect, provenance, ...).
 * Otherwise return `null` so routing can fall through to normal `/runs` → `/architecture/reviews` redirects, etc.
 *
 * Destinations use the public `/architecture/reviews/*` namespace (see `next.config.ts` redirects).
 */
export function demoRunAliasRedirectDestinationPath(pathname: string): string | null {
  if (pathname.length === 0) {
    return null;
  }

  const architectureReviews = /^\/architecture\/reviews\/([^/]+)(\/.*)?$/.exec(pathname);

  if (architectureReviews !== null) {
    return aliasDestinationIfNeeded(architectureReviews[1], architectureReviews[2] ?? "");
  }

  const runs = /^\/runs\/([^/]+)(\/.*)?$/.exec(pathname);

  if (runs !== null) {
    return aliasDestinationIfNeeded(runs[1], runs[2] ?? "");
  }

  const reviews = /^\/reviews\/([^/]+)(\/.*)?$/.exec(pathname);

  if (reviews !== null) {
    return aliasDestinationIfNeeded(reviews[1], reviews[2] ?? "");
  }

  return null;
}

function aliasDestinationIfNeeded(runIdSegmentRaw: string, tail: string): string | null {
  const runIdSegment = safeDecodePathSegment(runIdSegmentRaw);

  if (!demoRunUrlRequiresCanonicalRedirect(runIdSegment)) {
    return null;
  }

  const canon = canonicalizeDemoRunId(runIdSegment);

  return `/architecture/reviews/${encodeURIComponent(canon)}${tail}`;
}

function safeDecodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
