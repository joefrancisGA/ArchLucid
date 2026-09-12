import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  findingClassificationStatusTagKind,
  resolveFindingClassificationChipAriaLabel,
  resolveFindingClassificationChipReason,
  resolveFindingClassificationLabel,
  type FindingClassificationValue,
} from "@/lib/findings/finding-classification-chip-presentation";
import { cn } from "@/lib/utils";

export type {
  FindingClassificationValue,
} from "@/lib/findings/finding-classification-chip-presentation";

export {
  FINDING_CLASSIFICATION_CHECKLIST_DEMOTED_LABEL,
  FINDING_CLASSIFICATION_CHECKLIST_LABEL,
  FINDING_CLASSIFICATION_DECISION_GRADE_LABEL,
  FINDING_TREATMENT_DEMOTE_TO_CHECKLIST,
  findingClassificationStatusTagKind,
  resolveFindingClassificationLabel,
} from "@/lib/findings/finding-classification-chip-presentation";

export type FindingClassificationChipProps = {
  readonly classification: FindingClassificationValue;
  readonly treatment?: number | null;
  readonly findingId: string;
  readonly className?: string;
  readonly showReason?: boolean;
};

/** Two-band classification chip — never uses Ready/Approved workflow semantics (SD-12 / IS-07). */
export function FindingClassificationChip(props: FindingClassificationChipProps): ReactElement | null {
  const label = resolveFindingClassificationLabel(props.classification, props.treatment);

  if (label === null) {
    return null;
  }

  const showReason = props.showReason === true;
  const reason = resolveFindingClassificationChipReason(props.classification, props.treatment);

  return (
    <div
      className={cn("flex flex-col gap-1", props.className)}
      data-testid={`finding-classification-chip-wrap-${props.findingId}`}
    >
      <StatusTag
        kind={findingClassificationStatusTagKind(props.classification)}
        label={label}
        data-testid={`finding-classification-chip-${props.findingId}`}
        aria-label={resolveFindingClassificationChipAriaLabel(props.classification, props.treatment) ?? label}
      />
      {showReason && reason !== null ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{reason}</p>
      ) : null}
    </div>
  );
}
