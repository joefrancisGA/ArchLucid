import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";

import {
  FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
  FINDING_CLASSIFICATION_DECISION_GRADE,
} from "@/lib/findings/review-detail-findings-classification-band";

/** DX-12 export gate: null classification counts as decision-grade (back-compat). */
export function isDecisionGradeFindingForExport(finding: QuickDecisionFinding): boolean {
  if (finding.classification === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE) {
    return false;
  }

  if (finding.classification === FINDING_CLASSIFICATION_DECISION_GRADE) {
    return true;
  }

  return true;
}

export function isChecklistCoverageFindingForExport(finding: QuickDecisionFinding): boolean {
  return finding.classification === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE;
}

export type ItsmExportFindingPartition = {
  readonly exportableFindings: QuickDecisionFinding[];
  readonly omittedChecklistCount: number;
};

export function partitionFindingsForItsmExport(
  findings: readonly QuickDecisionFinding[],
): ItsmExportFindingPartition {
  const exportableFindings: QuickDecisionFinding[] = [];
  let omittedChecklistCount = 0;

  for (const finding of findings) {
    if (isChecklistCoverageFindingForExport(finding)) {
      omittedChecklistCount += 1;
      continue;
    }

    if (isDecisionGradeFindingForExport(finding)) {
      exportableFindings.push(finding);
    }
  }

  return { exportableFindings, omittedChecklistCount };
}

export function formatItsmExportScopeLabel(
  exportableCount: number,
  omittedChecklistCount: number,
): string | null {
  if (omittedChecklistCount <= 0) {
    return null;
  }

  const findingWord = exportableCount === 1 ? "finding" : "findings";

  return `Exporting ${exportableCount} decision-grade ${findingWord} (${omittedChecklistCount} checklist coverage omitted).`;
}
