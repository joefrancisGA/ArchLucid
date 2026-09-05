import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import {
  FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
  FINDING_CLASSIFICATION_DECISION_GRADE,
} from "@/lib/findings/review-detail-findings-classification-band";

export type FindingClassificationValue =
  | typeof FINDING_CLASSIFICATION_DECISION_GRADE
  | typeof FINDING_CLASSIFICATION_CHECKLIST_COVERAGE
  | null
  | undefined;

export const FINDING_CLASSIFICATION_DECISION_GRADE_LABEL = "Decision-grade" as const;

export const FINDING_CLASSIFICATION_CHECKLIST_LABEL = "Checklist coverage" as const;

export function resolveFindingClassificationLabel(
  classification: FindingClassificationValue,
): string | null {
  if (classification === FINDING_CLASSIFICATION_DECISION_GRADE) {
    return FINDING_CLASSIFICATION_DECISION_GRADE_LABEL;
  }

  if (classification === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE) {
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

export type FindingClassificationChipProps = {
  readonly classification: FindingClassificationValue;
  readonly findingId: string;
  readonly className?: string;
};

/** Two-band classification chip — never uses Ready/Approved workflow semantics (SD-12 / IS-07). */
export function FindingClassificationChip(props: FindingClassificationChipProps): ReactElement | null {
  const label = resolveFindingClassificationLabel(props.classification);

  if (label === null) {
    return null;
  }

  return (
    <StatusTag
      kind={findingClassificationStatusTagKind(props.classification)}
      label={label}
      className={props.className}
      data-testid={`finding-classification-chip-${props.findingId}`}
    />
  );
}
