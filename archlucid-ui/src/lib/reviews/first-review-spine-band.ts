import { feasibilityVerdictKindLabel, feasibilityVerdictTone } from "@/lib/feasibility-verdict-display";
import {
  countFindingsByClassificationBand,
  isDecisionGradeFinding,
} from "@/lib/findings/review-detail-findings-classification-band";
import { formatStructuralExecutionModeLabel } from "@/lib/structural-execution-mode";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

export type FirstReviewSpineBandSummary = {
  readonly gateOutcomeLabel: string;
  readonly gateOutcomeTone: "success" | "warning" | "danger";
  readonly gateOutcomeDetail: string | null;
  readonly executionModeLabel: string | null;
  readonly decisionGradeCount: number;
  readonly checklistCount: number;
  readonly uncitedCount: number;
  readonly topFindingTitle: string | null;
  readonly topFindingSeverityLabel: string | null;
};

export function countUncitedFindings(findings: readonly QuickDecisionFinding[]): number {
  let uncited = 0;

  for (const finding of findings) {
    if ((finding.evidenceRefCount ?? 0) === 0) {
      uncited += 1;
    }
  }

  return uncited;
}

function resolveTopDecisionGradeFinding(
  findings: readonly QuickDecisionFinding[],
): QuickDecisionFinding | null {
  const decisionGradeFindings = findings.filter((finding) => isDecisionGradeFinding(finding));

  if (decisionGradeFindings.length === 0) {
    return null;
  }

  return [...decisionGradeFindings].sort((left, right) => right.severityValue - left.severityValue)[0] ?? null;
}

function severityLabelFromValue(severityValue: number): string {
  if (severityValue >= 3) {
    return "Critical";
  }

  if (severityValue === 2) {
    return "High";
  }

  if (severityValue === 1) {
    return "Medium";
  }

  return "Low";
}

/** Compact first-viewport spine: gate outcome, execution mode, classification counts, top finding. */
export function deriveFirstReviewSpineBandSummary(input: {
  readonly feasibilityVerdict: ManifestFeasibilityVerdict | null | undefined;
  readonly structuralExecutionMode: StructuralExecutionModeInput;
  readonly findings: readonly QuickDecisionFinding[];
}): FirstReviewSpineBandSummary | null {
  const findings = input.findings;
  const classificationCounts = countFindingsByClassificationBand(findings);
  const uncitedCount = countUncitedFindings(findings);
  const topFinding = resolveTopDecisionGradeFinding(findings);
  const feasibilityVerdict = input.feasibilityVerdict ?? null;

  if (
    feasibilityVerdict === null
    && (input.structuralExecutionMode === null || input.structuralExecutionMode === undefined)
    && classificationCounts.decisionGrade + classificationCounts.checklist === 0
    && topFinding === null
  ) {
    return null;
  }

  const gateOutcomeLabel =
    feasibilityVerdict !== null ? feasibilityVerdictKindLabel(feasibilityVerdict.kind) : "Gate pending";
  const gateOutcomeTone =
    feasibilityVerdict !== null ? feasibilityVerdictTone(feasibilityVerdict.kind) : "warning";
  const gateOutcomeDetail = feasibilityVerdict?.summary?.trim() ?? null;
  const executionModeLabel =
    input.structuralExecutionMode === null || input.structuralExecutionMode === undefined
      ? null
      : formatStructuralExecutionModeLabel(input.structuralExecutionMode);

  return {
    gateOutcomeLabel,
    gateOutcomeTone,
    gateOutcomeDetail,
    executionModeLabel,
    decisionGradeCount: classificationCounts.decisionGrade,
    checklistCount: classificationCounts.checklist,
    uncitedCount,
    topFindingTitle: topFinding?.title?.trim() ?? null,
    topFindingSeverityLabel:
      topFinding !== null ? severityLabelFromValue(topFinding.severityValue) : null,
  };
}
