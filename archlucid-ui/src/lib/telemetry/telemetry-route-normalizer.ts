const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Normalize dynamic path segments so App Insights route dimensions stay low-cardinality. */
export function normalizeTelemetryRoute(pathname: string): string {
  const pathOnly = pathname.split("?")[0]?.trim() ?? "/";
  let normalized = pathOnly.replace(UUID_PATTERN, "[id]");

  if (normalized.startsWith("/architecture/reviews/")) {
    normalized = normalized.replace(/^\/architecture\/reviews\/[^/]+/i, "/architecture/reviews/[reviewId]");
  } else if (normalized.startsWith("/reviews/")) {
    // Legacy public prefix before next.config redirect settles.
    normalized = normalized.replace(/^\/reviews\/[^/]+/i, "/architecture/reviews/[reviewId]");
  }

  normalized = normalized.replace(
    /\/(?:manifests|governance\/signed-records|signed-records)\/[^/]+/i,
    "/governance/signed-records/[manifestId]",
  );

  if (normalized.length === 0) {
    return "/";
  }

  return normalized;
}
