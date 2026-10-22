/** Canonical Evidence graph (left-nav label); formerly `/graph` (retired — no redirect). */
export const EVIDENCE_GRAPH_PATH = "/insights/evidence-graph" as const;

/** Retired pre-release path — no App Router page and no next.config redirect. */
export const LEGACY_GRAPH_PATH = "/graph" as const;

export function isEvidenceGraphPath(pathname: string): boolean {
  return pathname === EVIDENCE_GRAPH_PATH || pathname.startsWith(`${EVIDENCE_GRAPH_PATH}/`);
}

/** Builds Evidence graph href with optional query (e.g. `runId`). */
export function evidenceGraphHref(query?: Record<string, string | undefined>): string {
  if (query === undefined) {
    return EVIDENCE_GRAPH_PATH;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value.length > 0) {
      params.set(key, value);
    }
  }

  const qs = params.toString();

  return qs.length > 0 ? `${EVIDENCE_GRAPH_PATH}?${qs}` : EVIDENCE_GRAPH_PATH;
}
