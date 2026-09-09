"use client";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { governanceWorkflowRunReadBlockedReason } from "@/lib/governance/governance-workflow-run-read-blocked-reason";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type GovernanceWorkflowRunListsBlockedCalloutProps = {
  readonly failure: ApiLoadFailureState | null;
};

/** Wave-64 suggestion 759: fail-closed governance workflow run-list blocked-reason on approval queue. */
export function GovernanceWorkflowRunListsBlockedCallout(
  props: GovernanceWorkflowRunListsBlockedCalloutProps,
) {
  const blockedReason = governanceWorkflowRunReadBlockedReason(props.failure);

  if (blockedReason === null && props.failure === null) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="governance-workflow-run-lists-blocked">
      {props.failure ? <OperatorApiProblem failure={props.failure} variant="warning" /> : null}
      {blockedReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{blockedReason}</p>
      ) : null}
    </div>
  );
}
