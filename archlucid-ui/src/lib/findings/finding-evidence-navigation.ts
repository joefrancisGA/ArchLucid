/** Canonical App Router segment for finding evidence trace pages. */
export const FINDING_EVIDENCE_TRACE_SEGMENT = "evidence-trace";

/** Retired URL segment — no redirect shim. */
export const FINDING_EVIDENCE_TRACE_LEGACY_SEGMENT = "inspect";

export const EVIDENCE_TRACE_PAGE_TITLE = "Evidence Trace";

export const EVIDENCE_TRACE_PAGE_SUBTITLE =
  "Inspect the policy, evidence, reasoning, audit linkage, and governance record supporting this finding.";

/** Finding detail page — parent surface of the evidence trace drill-down. */
export function getFindingDetailHref(runId: string, findingId: string): string {
  const encRun = encodeURIComponent(runId.trim());
  const encFinding = encodeURIComponent(findingId.trim());

  return `/architecture/reviews/${encRun}/findings/${encFinding}`;
}

/** Buyer-facing drill-down into the provenance chain for a finding (#7). */
export function getFindingEvidenceTraceHref(runId: string, findingId: string): string {
  return `${getFindingDetailHref(runId, findingId)}/${FINDING_EVIDENCE_TRACE_SEGMENT}`;
}

/** In-page anchor for the disposition workflow on the evidence trace surface. */
export const FINDING_GOVERNANCE_DISPOSITION_HASH = "governance-disposition-heading";

/** Deep link to record disposition on the evidence trace governance panel. */
export function getFindingGovernanceDispositionHref(runId: string, findingId: string): string {
  return `${getFindingEvidenceTraceHref(runId, findingId)}#${FINDING_GOVERNANCE_DISPOSITION_HASH}`;
}

/** @deprecated Prefer {@link getFindingEvidenceTraceHref}. */
export function getFindingEvidenceInspectHref(runId: string, findingId: string): string {
  return getFindingEvidenceTraceHref(runId, findingId);
}
