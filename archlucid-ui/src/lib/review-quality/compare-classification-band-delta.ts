import {
  countFindingsByClassificationBand,
} from "@/lib/findings/review-detail-findings-classification-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

export type CompareClassificationBandSide = {
  readonly label: string;
  readonly counts: ReturnType<typeof countFindingsByClassificationBand>;
  readonly summaryLine: string;
};

export type CompareClassificationBandDeltaView = {
  readonly baseline: CompareClassificationBandSide;
  readonly target: CompareClassificationBandSide;
};

function formatCompareClassificationBandSummaryLine(
  counts: ReturnType<typeof countFindingsByClassificationBand>,
): string {
  const segments = [
    `Decision-grade: ${counts.decisionGrade}`,
    `Checklist: ${counts.checklist}`,
  ];

  if (counts.uncited > 0) {
    segments.push(`Uncited: ${counts.uncited}`);
  }

  return segments.join(" · ");
}

export function buildCompareClassificationBandDeltaView(input: {
  readonly baselineFindings: readonly QuickDecisionFinding[];
  readonly targetFindings: readonly QuickDecisionFinding[];
}): CompareClassificationBandDeltaView | null {
  const baselineCounts = countFindingsByClassificationBand(input.baselineFindings);
  const targetCounts = countFindingsByClassificationBand(input.targetFindings);
  const baselineTotal = baselineCounts.decisionGrade + baselineCounts.checklist;
  const targetTotal = targetCounts.decisionGrade + targetCounts.checklist;

  if (baselineTotal === 0 && targetTotal === 0) {
    return null;
  }

  return {
    baseline: {
      label: "Baseline review",
      counts: baselineCounts,
      summaryLine: formatCompareClassificationBandSummaryLine(baselineCounts),
    },
    target: {
      label: "Updated review",
      counts: targetCounts,
      summaryLine: formatCompareClassificationBandSummaryLine(targetCounts),
    },
  };
}
