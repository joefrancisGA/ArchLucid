import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

export const HARD_INFEASIBLE_MISSING_CITATION_EXPORT_BLOCKED_REASON =
  "Hard infeasibility requires a law, theorem, or invariant contradiction reference before export.";

export function hasHardInfeasibleCitation(
  verdict: Pick<ManifestFeasibilityVerdict, "hardCitations" | "unsatCoreInvariantKeys">,
): boolean {
  const citations = verdict.hardCitations ?? [];

  if (citations.some((citation) => (citation.reference ?? "").trim().length > 0)) {
    return true;
  }

  const unsatCore = verdict.unsatCoreInvariantKeys ?? [];

  return unsatCore.some((key) => key.trim().length > 0);
}

export function resolveHardInfeasibleCitationExportBlockedReason(
  verdict: ManifestFeasibilityVerdict | null | undefined,
): string | null {
  if (verdict === null || verdict === undefined) {
    return null;
  }

  if (verdict.kind !== "HardInfeasible") {
    return null;
  }

  if (hasHardInfeasibleCitation(verdict)) {
    return null;
  }

  return HARD_INFEASIBLE_MISSING_CITATION_EXPORT_BLOCKED_REASON;
}
