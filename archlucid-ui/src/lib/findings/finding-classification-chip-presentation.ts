import {
  FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
  FINDING_CLASSIFICATION_DECISION_GRADE,
} from "@/lib/findings/review-detail-findings-classification-band";
import { INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE } from "@/lib/findings/insight-density-band";

export type FindingClassificationValue =
  | typeof FINDING_CLASSIFICATION_DECISION_GRADE
  | typeof FINDING_CLASSIFICATION_CHECKLIST_COVERAGE
  | null
  | undefined;

export const FINDING_CLASSIFICATION_DECISION_GRADE_LABEL = "Decision-grade" as const;

export const FINDING_CLASSIFICATION_CHECKLIST_LABEL = "Checklist coverage" as const;

export const FINDING_CLASSIFICATION_CHECKLIST_DEMOTED_LABEL = "Checklist-demoted" as const;

/** API `FindingTreatment.DemoteToChecklist` ordinal when insight-density gate demotes a finding. */
export const FINDING_TREATMENT_DEMOTE_TO_CHECKLIST = 1 as const;

export const FINDING_CLASSIFICATION_DECISION_GRADE_REASON =
  "Policy-mapped or insight-density-promoted finding eligible for disposition and career exports." as const;

export const FINDING_CLASSIFICATION_CHECKLIST_REASON =
  "Typed-engine checklist coverage; not a default pre-commit gate block." as const;

export function resolveFindingClassificationLabel(
  classification: FindingClassificationValue,
  treatment?: number | null,
): string | null {
  if (classification === FINDING_CLASSIFICATION_DECISION_GRADE) {
    return FINDING_CLASSIFICATION_DECISION_GRADE_LABEL;
  }

  if (classification === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE) {
    if (treatment === FINDING_TREATMENT_DEMOTE_TO_CHECKLIST) {
      return FINDING_CLASSIFICATION_CHECKLIST_DEMOTED_LABEL;
    }

    return FINDING_CLASSIFICATION_CHECKLIST_LABEL;
  }

  return null;
}

export function findingClassificationStatusTagKind(
  classification: FindingClassificationValue,
): "neutral" | "needs-attention" {
  if (classification === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE) {
    return "needs-attention";
  }

  return "neutral";
}

export function resolveFindingClassificationChipReason(
  classification: FindingClassificationValue,
  treatment?: number | null,
): string | null {
  if (classification === FINDING_CLASSIFICATION_DECISION_GRADE) {
    return FINDING_CLASSIFICATION_DECISION_GRADE_REASON;
  }

  if (classification === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE) {
    if (treatment === FINDING_TREATMENT_DEMOTE_TO_CHECKLIST) {
      return INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE;
    }

    return FINDING_CLASSIFICATION_CHECKLIST_REASON;
  }

  return null;
}

export function resolveFindingClassificationChipAriaLabel(
  classification: FindingClassificationValue,
  treatment?: number | null,
): string | null {
  const label = resolveFindingClassificationLabel(classification, treatment);
  const reason = resolveFindingClassificationChipReason(classification, treatment);

  if (label === null) {
    return null;
  }

  if (reason === null) {
    return label;
  }

  return `${label}. ${reason}`;
}
