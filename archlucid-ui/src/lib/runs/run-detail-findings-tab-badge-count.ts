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

export const RUN_DETAIL_FINDINGS_TAB_COUNT_NOT_STORED =
  "Findings tab count was not stored." as const;

/** When headline and triage counts are both absent, surface omission on the tab strip instead of a silent badge. */
export function resolveRunDetailFindingsTabCountHonestyLabel(
  findingCountDisplay: number | null,
  quickDecisionFindings: readonly QuickDecisionFinding[],
): string | null {
  if (resolveRunDetailFindingsTabBadgeCount(findingCountDisplay, quickDecisionFindings) !== null) {
    return null;
  }

  if (findingCountDisplay !== null) {
    return null;
  }

  return RUN_DETAIL_FINDINGS_TAB_COUNT_NOT_STORED;
}

/** Same fallback as tab badge counts for policy callout and review-package summary surfaces. */
export function resolveRunDetailDeferredSurfaceFindingCount(
  findingCountDisplay: number | null,
  quickDecisionFindings: readonly QuickDecisionFinding[],
): number | null {
  return resolveRunDetailFindingsTabBadgeCount(findingCountDisplay, quickDecisionFindings);
}

/** True when the detail snapshot exposes triage-visible findings — headline counts alone do not complete inspect triage. */
export function resolveRunDetailFindingsReviewed(
  findingCountDisplay: number | null,
  quickDecisionFindings: readonly QuickDecisionFinding[],
): boolean {
  void findingCountDisplay;

  return deriveRunDetailFindingsTriageCounts(quickDecisionFindings).triageVisibleCount > 0;
}
