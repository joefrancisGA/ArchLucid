/** Buyer-facing drill-down into the provenance chain for a finding (#7). */
export function getFindingEvidenceInspectHref(runId: string, findingId: string): string {
  const encRun = encodeURIComponent(runId.trim());
  const encFinding = encodeURIComponent(findingId.trim());

  return `/reviews/${encRun}/findings/${encFinding}/inspect`;
}
