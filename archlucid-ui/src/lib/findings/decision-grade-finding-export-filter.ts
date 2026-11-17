import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";

import {
  FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
  FINDING_CLASSIFICATION_DECISION_GRADE,
  isUnclassifiedFinding,
  isUnrecognizedFindingClassification,
} from "@/lib/findings/review-detail-findings-classification-band";

/** DX-12 export gate: only explicit DecisionGradeFinding rows export as decision-grade. */
export function isDecisionGradeFindingForExport(finding: QuickDecisionFinding): boolean {
  return finding.classification === FINDING_CLASSIFICATION_DECISION_GRADE;
}

export function isChecklistCoverageFindingForExport(finding: QuickDecisionFinding): boolean {
  return finding.classification === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE;
}

export function isUnclassifiedFindingForExport(finding: QuickDecisionFinding): boolean {
  return isUnclassifiedFinding(finding);
}

export type ItsmExportFindingPartition = {
  readonly exportableFindings: QuickDecisionFinding[];
  readonly omittedChecklistCount: number;
  readonly omittedUnclassifiedCount: number;
};

export function partitionFindingsForItsmExport(
  findings: readonly QuickDecisionFinding[],
): ItsmExportFindingPartition {
  const exportableFindings: QuickDecisionFinding[] = [];
  let omittedChecklistCount = 0;
  let omittedUnclassifiedCount = 0;

  for (const finding of findings) {
    if (isChecklistCoverageFindingForExport(finding)) {
      omittedChecklistCount += 1;
      continue;
    }

    if (
      isUnclassifiedFindingForExport(finding)
      || isUnrecognizedFindingClassification(finding.classification)
    ) {
      omittedUnclassifiedCount += 1;
      continue;
    }

    if (isDecisionGradeFindingForExport(finding)) {
      exportableFindings.push(finding);
    }
  }

  return { exportableFindings, omittedChecklistCount, omittedUnclassifiedCount };
}

export function formatItsmExportScopeLabel(
  exportableCount: number,
  omittedChecklistCount: number,
  omittedUnclassifiedCount = 0,
): string | null {
  const segments: string[] = [];

  if (omittedChecklistCount > 0) {
    segments.push(`${omittedChecklistCount} checklist coverage omitted`);
  }

  if (omittedUnclassifiedCount > 0) {
    segments.push(`${omittedUnclassifiedCount} unclassified (not decision-grade)`);
  }

  if (segments.length === 0) {
    return null;
  }

  const findingWord = exportableCount === 1 ? "finding" : "findings";

  return `Exporting ${exportableCount} decision-grade ${findingWord} (${segments.join("; ")}).`;
}
