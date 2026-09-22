"use client";

import {
  LivelihoodDocumentGuardDialog,
  useLivelihoodDocumentGuards,
  useLivelihoodIdleFormSnapshotPersistence,
} from "@/hooks/use-livelihood-document-guards";
import { governanceApprovalRationaleHasUnsavedEdits } from "@/lib/governance/governance-approval-rationale-unsaved";

export const GOVERNANCE_APPROVAL_RATIONALE_UNSAVED_MESSAGE =
  "You have an unsaved approval comment. Leave this page without submitting?";

export type GovernanceApprovalRationaleGuardsProps = {
  readonly approvalRequestId: string;
  readonly reviewComment: string;
  readonly reviewedBy: string;
  readonly setReviewComment: (value: string) => void;
  readonly setReviewedBy: (value: string) => void;
  readonly enabled: boolean;
};

/** Document + idle guards for the governance approval review comment (LW-072 / LW-073). */
export function GovernanceApprovalRationaleGuards(
  props: GovernanceApprovalRationaleGuardsProps,
): React.JSX.Element {
  const hasUnsavedEdits =
    props.enabled && governanceApprovalRationaleHasUnsavedEdits(props.reviewComment);
  const documentGuards = useLivelihoodDocumentGuards({
    when: hasUnsavedEdits,
    message: GOVERNANCE_APPROVAL_RATIONALE_UNSAVED_MESSAGE,
  });

  useLivelihoodIdleFormSnapshotPersistence({
    surfaceId: "governance-approval-rationale",
    entityKey: props.approvalRequestId,
    when: hasUnsavedEdits,
    fields: {
      reviewComment: props.reviewComment,
      reviewedBy: props.reviewedBy,
    },
    onRestore: (fields) => {
      if (fields.reviewComment !== undefined) {
        props.setReviewComment(fields.reviewComment);
      }

      if (fields.reviewedBy !== undefined) {
        props.setReviewedBy(fields.reviewedBy);
      }
    },
  });

  return (
    <LivelihoodDocumentGuardDialog
      message={documentGuards.dialogMessage}
      onCancelLeave={documentGuards.cancelLeave}
      onConfirmLeave={documentGuards.confirmLeave}
      open={documentGuards.dialogOpen}
    />
  );
}
