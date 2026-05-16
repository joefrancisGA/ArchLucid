import { canonicalizeDemoRunId, demoRunUrlRequiresCanonicalRedirect } from "@/lib/demo-run-canonical";

/**
 * When a URL uses a known demo run id alias (see {@link canonicalizeDemoRunId}), return the same path with the
 * canonical run segment and **all trailing segments preserved** (findings, inspect, provenance, ...).
 * Otherwise return `null` so routing can fall through to normal `/runs` → `/reviews` redirects, etc.
 */
export function demoRunAliasRedirectDestinationPath(pathname: string): string | null {
  if (pathname.length === 0) {
    return null;
  }

  const runs = /^\/runs\/([^/]+)(\/.*)?$/.exec(pathname);

  if (runs !== null) {
    const runIdSegment = safeDecodePathSegment(runs[1]);
    const tail = runs[2] ?? "";

    if (demoRunUrlRequiresCanonicalRedirect(runIdSegment)) {
      const canon = canonicalizeDemoRunId(runIdSegment);

      return `/reviews/${encodeURIComponent(canon)}${tail}`;
    }
  }

  const reviews = /^\/reviews\/([^/]+)(\/.*)?$/.exec(pathname);

  if (reviews !== null) {
    const runIdSegment = safeDecodePathSegment(reviews[1]);
    const tail = reviews[2] ?? "";

    if (demoRunUrlRequiresCanonicalRedirect(runIdSegment)) {
      const canon = canonicalizeDemoRunId(runIdSegment);

      return `/reviews/${encodeURIComponent(canon)}${tail}`;
    }
  }

  const executive = /^\/executive\/reviews\/([^/]+)(\/.*)?$/.exec(pathname);

  if (executive !== null) {
    const runIdSegment = safeDecodePathSegment(executive[1]);
    const tail = executive[2] ?? "";

    if (demoRunUrlRequiresCanonicalRedirect(runIdSegment)) {
      const canon = canonicalizeDemoRunId(runIdSegment);

      return `/executive/reviews/${encodeURIComponent(canon)}${tail}`;
    }
  }

  return null;
}

function safeDecodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
