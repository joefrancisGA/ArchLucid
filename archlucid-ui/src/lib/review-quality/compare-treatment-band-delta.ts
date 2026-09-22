import { FINDING_TREATMENT_DEMOTE_TO_CHECKLIST } from "@/lib/findings/finding-classification-chip-presentation";
import {
  isDecisionGradeFinding,
} from "@/lib/findings/review-detail-findings-classification-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

export type CompareTreatmentBandCounts = {
  readonly decisionGrade: number;
  readonly checklist: number;
  readonly demotedToChecklist: number;
};

export type CompareTreatmentBandSide = {
  readonly label: string;
  readonly counts: CompareTreatmentBandCounts;
  readonly summaryLine: string;
};

export type CompareTreatmentBandDeltaView = {
  readonly baseline: CompareTreatmentBandSide;
  readonly target: CompareTreatmentBandSide;
};

export function countFindingsByTreatmentBand(
  findings: readonly QuickDecisionFinding[],
): CompareTreatmentBandCounts {
  let decisionGrade = 0;
  let checklist = 0;
  let demotedToChecklist = 0;

  for (const finding of findings) {
    if (finding.treatment === FINDING_TREATMENT_DEMOTE_TO_CHECKLIST) {
      demotedToChecklist += 1;
      continue;
    }

    if (isDecisionGradeFinding(finding)) {
      decisionGrade += 1;
      continue;
    }

    if (finding.classification === "ChecklistCoverage") {
      checklist += 1;
    }
  }

  return { decisionGrade, checklist, demotedToChecklist };
}

function formatCompareTreatmentBandSummaryLine(counts: CompareTreatmentBandCounts): string {
  const segments = [
    `Decision-grade: ${counts.decisionGrade}`,
    `Checklist: ${counts.checklist}`,
  ];

  if (counts.demotedToChecklist > 0) {
    segments.push(`Demoted: ${counts.demotedToChecklist}`);
  }

  return segments.join(" · ");
}

export function buildCompareTreatmentBandDeltaView(input: {
  readonly baselineFindings: readonly QuickDecisionFinding[];
  readonly targetFindings: readonly QuickDecisionFinding[];
}): CompareTreatmentBandDeltaView | null {
  const baselineCounts = countFindingsByTreatmentBand(input.baselineFindings);
  const targetCounts = countFindingsByTreatmentBand(input.targetFindings);
  const baselineTotal =
    baselineCounts.decisionGrade + baselineCounts.checklist + baselineCounts.demotedToChecklist;
  const targetTotal = targetCounts.decisionGrade + targetCounts.checklist + targetCounts.demotedToChecklist;

  if (baselineTotal === 0 && targetTotal === 0) {
    return null;
  }

  return {
    baseline: {
      label: "Baseline review",
      counts: baselineCounts,
      summaryLine: formatCompareTreatmentBandSummaryLine(baselineCounts),
    },
    target: {
      label: "Updated review",
      counts: targetCounts,
      summaryLine: formatCompareTreatmentBandSummaryLine(targetCounts),
    },
  };
}
