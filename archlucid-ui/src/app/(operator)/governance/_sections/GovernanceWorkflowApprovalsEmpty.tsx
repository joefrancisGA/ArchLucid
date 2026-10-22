import { cn } from "@/lib/utils";
import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import {
  governanceWorkflowNoApprovalsOperatorHint,
  governanceWorkflowNoApprovalsReaderHint,
} from "@/lib/enterprise-controls-context-copy";
import {
  governanceNoApprovalsGettingStartedOperator,
  governanceNoApprovalsGettingStartedReader,
} from "@/lib/governance/governance-workflow-empty-guidance";
import type { GovernanceApprovalWorkflowState } from "@/app/(operator)/governance/_sections/governance-approval-workflow-state";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_WORKFLOW_NO_APPROVALS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";

export type GovernanceWorkflowApprovalsEmptyProps = {
  readonly workflowState: GovernanceApprovalWorkflowState;
  readonly listFailure: ApiLoadFailureState | null;
  readonly canMutateWorkflow: boolean;
};

export function GovernanceWorkflowApprovalsEmpty(props: GovernanceWorkflowApprovalsEmptyProps) {
  const { workflowState, listFailure, canMutateWorkflow } = props;

  return (
    <>
      {workflowState.phase === "loading" ? (
        <OperatorLoadingNotice>
          <strong>Loading workflow data.</strong>
          <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Loading approval history and workflow status for this review.
          </p>
        </OperatorLoadingNotice>
      ) : null}

      {workflowState.phase === "no_requests" && listFailure === null ? (
        <EnterpriseCompactEmptyState
          {...GOVERNANCE_WORKFLOW_NO_APPROVALS_EMPTY_COMPACT}
          description={
            <div className="grid gap-3">
              <p className={OPERATOR_TYPOGRAPHY.body}>
                {canMutateWorkflow ? governanceWorkflowNoApprovalsOperatorHint : governanceWorkflowNoApprovalsReaderHint}
              </p>
              <GettingStartedSteps
                {...(canMutateWorkflow
                  ? governanceNoApprovalsGettingStartedOperator
                  : governanceNoApprovalsGettingStartedReader)}
              />
            </div>
          }
        />
      ) : null}
    </>
  );
}
