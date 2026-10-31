import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";

export type ReviewFindingsClassificationBandId = "decision-grade" | "checklist" | "uncited" | "all";

export function isEvidenceRefCountNotStored(finding: QuickDecisionFinding): boolean {
  return finding.evidenceRefCount === null || finding.evidenceRefCount === undefined;
}

export function hasMissingEvidenceReferenceCount(findings: readonly QuickDecisionFinding[]): boolean {
  return findings.some((finding) => isEvidenceRefCountNotStored(finding));
}

export function isUncitedFinding(finding: QuickDecisionFinding): boolean {
  return finding.evidenceRefCount === 0;
}

export const FINDING_CLASSIFICATION_DECISION_GRADE = "DecisionGradeFinding" as const;

export const FINDING_CLASSIFICATION_CHECKLIST_COVERAGE = "ChecklistCoverage" as const;

export const FINDING_CLASSIFICATION_NOT_STORED_LABEL = "Finding classification was not stored." as const;

export function isUnrecognizedFindingClassification(classification: unknown): boolean {
  if (classification === null || classification === undefined) {
    return false;
  }

  if (typeof classification !== "string") {
    return true;
  }

  const trimmed = classification.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return (
    trimmed !== FINDING_CLASSIFICATION_DECISION_GRADE && trimmed !== FINDING_CLASSIFICATION_CHECKLIST_COVERAGE
  );
}

export function isUnclassifiedFinding(finding: QuickDecisionFinding): boolean {
  return finding.classification === null || finding.classification === undefined;
}

export function isChecklistCoverageFinding(finding: QuickDecisionFinding): boolean {
  return finding.classification === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE;
}

export function isDecisionGradeFinding(finding: QuickDecisionFinding): boolean {
  return finding.classification === FINDING_CLASSIFICATION_DECISION_GRADE;
}

export function filterFindingsByClassificationBand(
  findings: readonly QuickDecisionFinding[],
  band: ReviewFindingsClassificationBandId,
): QuickDecisionFinding[] {
  if (band === "all") {
    return [...findings];
  }

  if (band === "uncited") {
    return findings.filter((finding) => isUncitedFinding(finding));
  }

  if (band === "checklist") {
    return findings.filter((finding) => isChecklistCoverageFinding(finding));
  }

  return findings.filter((finding) => isDecisionGradeFinding(finding));
}

export function countFindingsByClassificationBand(
  findings: readonly QuickDecisionFinding[],
): {
  readonly decisionGrade: number;
  readonly checklist: number;
  readonly uncited: number;
  readonly unclassified: number;
} {
  let decisionGrade = 0;
  let checklist = 0;
  let uncited = 0;
  let unclassified = 0;

  for (const finding of findings) {
    if (finding.classification === FINDING_CLASSIFICATION_DECISION_GRADE) {
      decisionGrade += 1;
    } else if (finding.classification === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE) {
      checklist += 1;
    } else if (isUnclassifiedFinding(finding)) {
      unclassified += 1;
    } else if (isUnrecognizedFindingClassification(finding.classification)) {
      unclassified += 1;
    }

    if (isUncitedFinding(finding)) {
      uncited += 1;
    }
  }

  return { decisionGrade, checklist, uncited, unclassified };
}
