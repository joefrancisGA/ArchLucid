const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Normalize dynamic path segments so App Insights route dimensions stay low-cardinality. */
export function normalizeTelemetryRoute(pathname: string): string {
  const pathOnly = pathname.split("?")[0]?.trim() ?? "/";
  let normalized = pathOnly.replace(UUID_PATTERN, "[id]");

  normalized = normalized.replace(/\/reviews\/[^/]+/i, "/reviews/[runId]");
  normalized = normalized.replace(/\/(?:manifests|signed-records)\/[^/]+/i, "/signed-records/[manifestId]");
  normalized = normalized.replace(/\/signed-records\/[^/]+/i, "/signed-records/[recordId]");

  if (normalized.length === 0) {
    return "/";
  }

  return normalized;
}
