import { cn } from "@/lib/utils";
import { GovernanceRecordCorrectionInlineControl } from "@/components/governance/GovernanceRecordCorrectionInlineControl";
import { GovernanceStatusTag } from "@/components/governance/GovernanceStatusTag";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatActionActorName } from "@/lib/action-actor-display";
import { buyerGovernanceWorkflowStatusLabel } from "@/lib/buyer/buyer-governance-workflow-status-labels";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import {
  formatGovernanceBusinessInstant,
  governanceApprovalCardTitle,
  governanceEnvironmentPairDisplay,
} from "./governance-workflow-helpers";

export type GovernanceWorkflowApprovalsQueueRowProps = {
  readonly row: GovernanceApprovalRequest;
  readonly buyerPolishedShell: boolean;
};

export function GovernanceWorkflowApprovalsQueueRow(props: GovernanceWorkflowApprovalsQueueRowProps) {
  const { row, buyerPolishedShell } = props;

  return (
    <>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div className="min-w-0 flex-1">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{governanceApprovalCardTitle(row)}</CardTitle>
          <CardDescription>
            {governanceEnvironmentPairDisplay(row.sourceEnvironment, row.targetEnvironment)}
          </CardDescription>
          <p className="sr-only">Approval request id {row.approvalRequestId}</p>
        </div>
        <GovernanceStatusTag
          status={buyerPolishedShell ? buyerGovernanceWorkflowStatusLabel(row.status) : row.status}
          className={OPERATOR_TYPOGRAPHY.badge}
        />
      </CardHeader>
      <CardContent className={cn("grid gap-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Requested by</span>{" "}
          {formatActionActorName(row.requestedBy)}
        </div>
        <div>
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Requested</span>{" "}
          {formatGovernanceBusinessInstant(row.requestedUtc)}
        </div>
        {row.requestComment ? (
          <div>
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Comment</span> {row.requestComment}
          </div>
        ) : null}
        <div>
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Reviewed by</span>{" "}
          {formatActionActorName(row.reviewedBy)}
          {row.reviewedUtc ? ` · ${formatGovernanceBusinessInstant(row.reviewedUtc)}` : null}
        </div>
        {row.reviewComment ? (
          <div>
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Review comment</span>{" "}
            {row.reviewComment}
          </div>
        ) : null}

        {row.status === "Approved" || row.status === "Rejected" ? (
          <GovernanceRecordCorrectionInlineControl
            testId={`governance-approval-correction-${row.approvalRequestId}`}
            target={{
              mutationKind:
                row.status === "Approved" ? "governance_workflow_approve" : "governance_workflow_reject",
              subjectId: row.approvalRequestId,
              runId: row.runId,
            }}
          />
        ) : null}
      </CardContent>
    </>
  );
}

export type GovernanceWorkflowApprovalsQueueChromeProps = {
  readonly approvalsCount: number;
  readonly mutationDisabledHintId: string;
  readonly mutationDisabledReason: WhyDisabledCtaReason | null;
};

export function GovernanceWorkflowApprovalsQueueChrome(props: GovernanceWorkflowApprovalsQueueChromeProps) {
  const { approvalsCount, mutationDisabledHintId, mutationDisabledReason } = props;

  if (approvalsCount === 0) {
    return null;
  }

  return (
    <WhyDisabledCtaHint
      id={mutationDisabledHintId}
      reason={mutationDisabledReason}
      testId={mutationDisabledHintId}
    />
  );
}
