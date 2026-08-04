/** Canonical App Router segment for finding evidence trace pages. */
export const FINDING_EVIDENCE_TRACE_SEGMENT = "evidence-trace";

/** Legacy segment — redirects to {@link FINDING_EVIDENCE_TRACE_SEGMENT}. */
export const FINDING_EVIDENCE_TRACE_LEGACY_SEGMENT = "inspect";

export const EVIDENCE_TRACE_PAGE_TITLE = "Evidence Trace";

export const EVIDENCE_TRACE_PAGE_SUBTITLE =
  "Inspect the policy, evidence, reasoning, audit linkage, and governance record supporting this finding.";

/** Buyer-facing drill-down into the provenance chain for a finding (#7). */
export function getFindingEvidenceTraceHref(runId: string, findingId: string): string {
  const encRun = encodeURIComponent(runId.trim());
  const encFinding = encodeURIComponent(findingId.trim());

  return `/architecture/reviews/${encRun}/findings/${encFinding}/${FINDING_EVIDENCE_TRACE_SEGMENT}`;
}

/** @deprecated Prefer {@link getFindingEvidenceTraceHref}. */
export function getFindingEvidenceInspectHref(runId: string, findingId: string): string {
  return getFindingEvidenceTraceHref(runId, findingId);
}

/**
 * When a URL still uses the legacy `/inspect` tail, return the canonical `/evidence-trace` path
 * (query string preserved by callers).
 */
export function findingEvidenceTraceLegacyRedirectPath(pathname: string): string | null {
  if (pathname.length === 0) {
    return null;
  }

  const reviews = /^(\/reviews\/[^/]+\/findings\/[^/]+)\/inspect(\/.*)?$/i.exec(pathname);

  if (reviews !== null) {
    return `${reviews[1]}/${FINDING_EVIDENCE_TRACE_SEGMENT}${reviews[2] ?? ""}`;
  }

  const runs = /^(\/runs\/[^/]+\/findings\/[^/]+)\/inspect(\/.*)?$/i.exec(pathname);

  if (runs !== null) {
    return `${runs[1]}/${FINDING_EVIDENCE_TRACE_SEGMENT}${runs[2] ?? ""}`;
  }

  return null;
}
