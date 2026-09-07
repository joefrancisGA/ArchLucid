import { deriveRunDetailFindingsTriageCounts } from "@/lib/runs/run-detail-findings-triage-counts";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

/** Prefer explanation headline counts; fall back to detail snapshot when explanation is still deferred. */
export function resolveRunDetailFindingsTabBadgeCount(
  findingCountDisplay: number | null,
  quickDecisionFindings: readonly QuickDecisionFinding[],
): number | null {
  if (typeof findingCountDisplay === "number" && Number.isFinite(findingCountDisplay) && findingCountDisplay > 0) {
    return Math.trunc(findingCountDisplay);
  }

  const triageVisibleCount = deriveRunDetailFindingsTriageCounts(quickDecisionFindings).triageVisibleCount;

  if (triageVisibleCount > 0) {
    return triageVisibleCount;
  }

  return null;
}
