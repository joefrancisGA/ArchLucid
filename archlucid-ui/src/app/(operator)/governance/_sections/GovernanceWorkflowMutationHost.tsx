"use client";

import { useState } from "react";

import { GovernanceRecordCorrectionDialog } from "@/components/governance/GovernanceRecordCorrectionDialog";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { ReversibleMutationSuccessCallout } from "@/components/operator/ReversibleMutationSuccessCallout";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { GOVERNANCE_CONCURRENCY_CONFLICT_RECOVERY } from "@/lib/error-recovery-contract-copy";
import type { UseGovernanceWorkflowMutationsResult } from "@/hooks/use-governance-workflow-mutations";

import { GovernanceWorkflowDialogsDeferred } from "./governance-workflow-deferred-chunks";

type GovernanceWorkflowMutationHostProps = {
  readonly mutations: UseGovernanceWorkflowMutationsResult;
  readonly showInlineFeedback?: boolean;
};

export function GovernanceWorkflowMutationHost(props: GovernanceWorkflowMutationHostProps) {
  const { mutations, showInlineFeedback = true } = props;
  const {
    mutationSuccessMessage,
    setMutationSuccessMessage,
    mutationCorrectionTarget,
    mutationCorrectionMutationId,
    setMutationCorrectionTarget,
    setMutationCorrectionMutationId,
    mutationErrorMessage,
    mutationErrorIsConcurrencyConflict,
    pendingPromote,
    setPendingPromote,
    pendingPromoteRequestRef,
    promoteBusy,
    onConfirmPromote,
    pendingActivate,
    setPendingActivate,
    pendingActivatePromotionRef,
    activateBusyId,
    onConfirmActivateFromPromotion,
  } = mutations;
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [correctionRecorded, setCorrectionRecorded] = useState(false);

  const successMessage =
    mutationSuccessMessage === null
      ? null
      : correctionRecorded
        ? `${mutationSuccessMessage} ${GOVERNANCE_MUTATION_CORRECTION_SUCCESS_MESSAGE}`
        : mutationSuccessMessage;

  return (
    <>
      {showInlineFeedback && successMessage !== null && mutationCorrectionMutationId !== null ? (
        <ReversibleMutationSuccessCallout
          message={successMessage}
          mutationId={mutationCorrectionMutationId}
          testId="governance-workflow-mutation-success"
          className="mb-4"
          onDismiss={() => {
            setMutationSuccessMessage(null);
            setMutationCorrectionTarget(null);
            setMutationCorrectionMutationId(null);
            setCorrectionRecorded(false);
          }}
          onRecordCorrection={
            mutationCorrectionTarget !== null
              ? () => {
                  setCorrectionDialogOpen(true);
                }
              : undefined
          }
        />
      ) : null}

      {showInlineFeedback && mutationSuccessMessage !== null && mutationCorrectionMutationId === null ? (
        <OperatorSuccessCallout
          message={mutationSuccessMessage}
          testId="governance-workflow-mutation-success"
          className="mb-4"
          onDismiss={() => setMutationSuccessMessage(null)}
        />
      ) : null}

      {showInlineFeedback && mutationErrorMessage !== null ? (
        <OperatorMutationInlineError
          message={mutationErrorMessage}
          testId="governance-workflow-mutation-error"
          className="mb-4"
          recoveryPresentation={
            mutationErrorIsConcurrencyConflict ? GOVERNANCE_CONCURRENCY_CONFLICT_RECOVERY : undefined
          }
        />
      ) : null}

      <GovernanceRecordCorrectionDialog
        open={correctionDialogOpen}
        onOpenChange={setCorrectionDialogOpen}
        target={mutationCorrectionTarget}
        onRecorded={() => {
          setCorrectionRecorded(true);
        }}
      />

      <GovernanceWorkflowDialogsDeferred
        pendingPromote={pendingPromote}
        setPendingPromote={setPendingPromote}
        pendingPromoteRequestRef={pendingPromoteRequestRef}
        promoteBusy={promoteBusy}
        onConfirmPromote={onConfirmPromote}
        pendingActivate={pendingActivate}
        setPendingActivate={setPendingActivate}
        pendingActivatePromotionRef={pendingActivatePromotionRef}
        activateBusyId={activateBusyId}
        onConfirmActivateFromPromotion={onConfirmActivateFromPromotion}
      />
    </>
  );
}
