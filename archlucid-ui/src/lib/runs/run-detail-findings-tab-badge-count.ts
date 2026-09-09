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

/** Same fallback as tab badge counts for policy callout and review-package summary surfaces. */
export function resolveRunDetailDeferredSurfaceFindingCount(
  findingCountDisplay: number | null,
  quickDecisionFindings: readonly QuickDecisionFinding[],
): number | null {
  return resolveRunDetailFindingsTabBadgeCount(findingCountDisplay, quickDecisionFindings);
}

/** True when explanation or detail snapshot exposes triage-visible findings for inspect/checklist gating. */
export function resolveRunDetailFindingsReviewed(
  findingCountDisplay: number | null,
  quickDecisionFindings: readonly QuickDecisionFinding[],
): boolean {
  return (resolveRunDetailFindingsTabBadgeCount(findingCountDisplay, quickDecisionFindings) ?? 0) > 0;
}
