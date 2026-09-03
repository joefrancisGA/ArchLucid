import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import {
  INSIGHT_DENSITY_GENERIC_THRESHOLD,
  isLowInsightDensityScore,
} from "@/lib/governance/governance-findings-density-sort";

export { INSIGHT_DENSITY_GENERIC_THRESHOLD };

export function filterReviewDetailFindingsHideGeneric(
  findings: readonly QuickDecisionFinding[],
  hideGeneric: boolean,
): QuickDecisionFinding[] {
  if (!hideGeneric) {
    return [...findings];
  }

  return findings.filter((finding) => !isLowInsightDensityScore(finding.insightDensityScore ?? null));
}

/** Working-mode default: highest signal first without dropping rows (density score when present). */
export function sortReviewDetailFindingsBySignal(
  findings: readonly QuickDecisionFinding[],
): QuickDecisionFinding[] {
  return [...findings].sort((left, right) => {
    const leftScore = left.insightDensityScore ?? -1;
    const rightScore = right.insightDensityScore ?? -1;

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    const severityDelta = left.severityValue - right.severityValue;

    if (severityDelta !== 0) {
      return severityDelta;
    }

    return left.findingOrder - right.findingOrder;
  });
}
