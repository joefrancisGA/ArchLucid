import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";

export type ReviewFindingsClassificationBandId = "decision-grade" | "checklist" | "all";

export const FINDING_CLASSIFICATION_DECISION_GRADE = "DecisionGradeFinding" as const;

export const FINDING_CLASSIFICATION_CHECKLIST_COVERAGE = "ChecklistCoverage" as const;

export function isChecklistCoverageFinding(finding: QuickDecisionFinding): boolean {
  return finding.classification === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE;
}

export function isDecisionGradeFinding(finding: QuickDecisionFinding): boolean {
  if (finding.classification === FINDING_CLASSIFICATION_DECISION_GRADE) {
    return true;
  }

  if (finding.classification === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE) {
    return false;
  }

  // Legacy rows without classification: treat low density as checklist when score is present.
  const score = finding.insightDensityScore;

  if (score === null || score === undefined) {
    return true;
  }

  return score >= 50;
}

export function filterFindingsByClassificationBand(
  findings: readonly QuickDecisionFinding[],
  band: ReviewFindingsClassificationBandId,
): QuickDecisionFinding[] {
  if (band === "all") {
    return [...findings];
  }

  if (band === "checklist") {
    return findings.filter((finding) => isChecklistCoverageFinding(finding) || !isDecisionGradeFinding(finding));
  }

  return findings.filter((finding) => isDecisionGradeFinding(finding));
}

export function countFindingsByClassificationBand(
  findings: readonly QuickDecisionFinding[],
): { readonly decisionGrade: number; readonly checklist: number } {
  let decisionGrade = 0;
  let checklist = 0;

  for (const finding of findings) {
    if (isDecisionGradeFinding(finding)) {
      decisionGrade += 1;
    } else {
      checklist += 1;
    }
  }

  return { decisionGrade, checklist };
}
