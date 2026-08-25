/** GET paths that emit extra proxy start/timeout breadcrumbs while hang hunts are open. */

/** Matches GET /v1/architecture/draft/{guid} only — nested routes like /questions are excluded. */
const ARCHITECTURE_DRAFT_GET_PATH =
  /^v1\/architecture\/draft\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function shouldTraceProxyInteractiveReadHang(
  method: string,
  normalizedTailPath: string,
): boolean {
  if (method !== "GET") {
    return false;
  }

  if (normalizedTailPath === "v1/learning/plans") {
    return true;
  }

  return ARCHITECTURE_DRAFT_GET_PATH.test(normalizedTailPath);
}
