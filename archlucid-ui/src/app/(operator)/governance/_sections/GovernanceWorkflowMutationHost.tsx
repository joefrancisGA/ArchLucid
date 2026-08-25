"use client";

import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
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
    mutationErrorMessage,
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

  return (
    <>
      {showInlineFeedback && mutationSuccessMessage !== null ? (
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
        />
      ) : null}

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
