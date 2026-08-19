/**
 * Parses an opaque operation id from a 202 Location header
 * (e.g. `/v1/operations/run:{guid}` or absolute URL).
 */
export function parseOperationIdFromLocation(location: string | null | undefined): string | null {
  if (location === null || location === undefined) {
    return null;
  }

  const trimmed = location.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const marker = "/operations/";
  const markerIndex = trimmed.toLowerCase().indexOf(marker);

  if (markerIndex < 0) {
    return null;
  }

  const rest = trimmed.slice(markerIndex + marker.length);
  const withoutQuery = rest.split("?")[0] ?? "";
  const withoutHash = withoutQuery.split("#")[0] ?? "";
  const decoded = decodeURIComponent(withoutHash.trim());

  if (decoded.length === 0) {
    return null;
  }

  return decoded;
}

/** Prefer run detail when resultRef has a runId; otherwise fall back to caller href. */
export function resolveOperationDetailHref(
  fallbackHref: string,
  runId: string | null | undefined,
): string {
  if (runId !== null && runId !== undefined && runId.trim().length > 0) {
    return `/architecture/reviews/${encodeURIComponent(runId.trim())}`;
  }

  return fallbackHref;
}
