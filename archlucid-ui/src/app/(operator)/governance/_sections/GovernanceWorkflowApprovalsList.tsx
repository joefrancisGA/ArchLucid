import { useMemo, type MutableRefObject } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/card";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { governanceApprovalQueueFilterHrefFromSearch } from "@/lib/governance/governance-approval-queue-filter-url";
import {
  GOVERNANCE_APPROVAL_STATUS_FILTER_PARAM,
  filterGovernanceApprovalsByStatusFilter,
  governanceApprovalStatusFilterLabel,
  parseGovernanceApprovalStatusFilter,
} from "@/lib/governance/governance-approval-status-filter";
import { GOVERNANCE_APPROVAL_STATUS_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-approval-status-filter-empty-not-load-failure-copy";
import { cn } from "@/lib/utils";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";
import type { GovernanceApprovalWorkflowState } from "@/app/(operator)/governance/_sections/governance-approval-workflow-state";
import { resolveApprovalQueueTriageFirstPending } from "@/lib/governance/resolve-approval-queue-triage-first-pending";
import {
  resolveContinueLastApprovalRequest,
  writeApprovalQueueLastViewedRequestId,
} from "@/lib/resolve-continue-last-approval-request";

import { ApprovalQueueTriageFirstPendingStrip } from "./ApprovalQueueTriageFirstPendingStrip";
import { ApprovalQueueContinueLastViewedRow } from "./ApprovalQueueContinueLastViewedRow";
import { GovernanceWorkflowApprovalsEmpty } from "./GovernanceWorkflowApprovalsEmpty";
import { GovernanceWorkflowApprovalsMutations } from "./GovernanceWorkflowApprovalsMutations";
import {
  GovernanceWorkflowApprovalsQueueChrome,
  GovernanceWorkflowApprovalsQueueRow,
} from "./GovernanceWorkflowApprovalsQueue";
import { GovernanceWorkflowApprovalsStatusFilterBar } from "./GovernanceWorkflowApprovalsStatusFilterBar";
import { GovernanceWorkflowApprovalsStatusFilterEmptyPartialHonesty } from "./GovernanceWorkflowApprovalsStatusFilterEmptyPartialHonesty";
import { GovernanceWorkflowApprovalsListLoadFailureHonesty } from "./GovernanceWorkflowApprovalsListLoadFailureHonesty";
import type { GovernanceWorkflowPendingReview } from "./governance-workflow-helpers";

export type GovernanceWorkflowApprovalsListProps = {
  buyerPolishedShell: boolean;
  canMutateWorkflow: boolean;
  listsLoading: boolean;
  activeRunId: string | null;
  approvals: GovernanceApprovalRequest[];
  workflowState: GovernanceApprovalWorkflowState;
  listFailure: ApiLoadFailureState | null;
  emphasizeDecisionRecord: boolean;
  pendingReview: GovernanceWorkflowPendingReview | null;
  setPendingReview: (v: GovernanceWorkflowPendingReview | null) => void;
  reviewedBy: string;
  setReviewedBy: (v: string) => void;
  reviewComment: string;
  setReviewComment: (v: string) => void;
  reviewBusy: boolean;
  onConfirmReview: () => void | Promise<void>;
  workflowActor: string;
  refreshIfActive: () => void | Promise<void>;
  pendingPromote: { manifestId: string; targetEnv: string } | null;
  setPendingPromote: (v: { manifestId: string; targetEnv: string } | null) => void;
  pendingPromoteRequestRef: MutableRefObject<GovernanceApprovalRequest | null>;
};

export function GovernanceWorkflowApprovalsList(props: GovernanceWorkflowApprovalsListProps) {
  const searchParams = useSearchParams();
  const statusFilter = parseGovernanceApprovalStatusFilter(searchParams.get(GOVERNANCE_APPROVAL_STATUS_FILTER_PARAM));
  const {
    buyerPolishedShell,
    canMutateWorkflow,
    activeRunId,
    approvals,
    listsLoading,
    workflowState,
    listFailure,
    emphasizeDecisionRecord,
    pendingReview,
    setPendingReview,
    reviewedBy,
    setReviewedBy,
    reviewComment,
    setReviewComment,
    reviewBusy,
    onConfirmReview,
    workflowActor,
    refreshIfActive,
    pendingPromote,
    setPendingPromote,
    pendingPromoteRequestRef,
  } = props;

  const compactSupportingRows = emphasizeDecisionRecord && workflowState.canShowCompletionMessaging;
  const mutationDisabledHintId = "governance-workflow-approvals-mutate-disabled-hint";
  const mutationDisabledReason = canMutateWorkflow ? null : whyDisabledEnterpriseMutationControl();
  const triageFirstPending = useMemo(
    () => resolveApprovalQueueTriageFirstPending(approvals),
    [approvals],
  );
  const continueLastRequest = useMemo(
    () => resolveContinueLastApprovalRequest(approvals),
    [approvals],
  );
  const filteredApprovals = useMemo(
    () => filterGovernanceApprovalsByStatusFilter(approvals, statusFilter),
    [approvals, statusFilter],
  );
  const showStatusFilterEmpty =
    !listsLoading
    && listFailure === null
    && statusFilter !== null
    && approvals.length > 0
    && filteredApprovals.length === 0;

  function openApprovalRequest(approvalRequestId: string): void {
    writeApprovalQueueLastViewedRequestId(approvalRequestId);
    document
      .querySelector(`[data-approval-request-id="${approvalRequestId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const mutationProps = {
    buyerPolishedShell,
    canMutateWorkflow,
    compactSupportingRows,
    pendingReview,
    setPendingReview,
    reviewedBy,
    setReviewedBy,
    reviewComment,
    setReviewComment,
    reviewBusy,
    onConfirmReview,
    workflowActor,
    refreshIfActive,
    pendingPromote,
    setPendingPromote,
    pendingPromoteRequestRef,
    mutationDisabledHintId,
    mutationDisabledReason,
  };

  return (
    <div className="mt-6 grid gap-4">
      {activeRunId !== null && approvals.length > 0 ? <GovernanceWorkflowApprovalsStatusFilterBar /> : null}

      <GovernanceWorkflowApprovalsListLoadFailureHonesty listFailure={listFailure} />

      <GovernanceWorkflowApprovalsEmpty
        workflowState={workflowState}
        listFailure={listFailure}
        canMutateWorkflow={canMutateWorkflow}
      />

      {showStatusFilterEmpty ? (
        <EnterpriseCompactEmptyState
          testId="governance-approval-status-filter-empty"
          title={`No ${governanceApprovalStatusFilterLabel(statusFilter).toLowerCase()} approval requests`}
          description="This review has approval requests in other statuses. Clear the filter to see the full queue."
          footer={
            <div className="space-y-2">
              <p
                className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="governance-approval-status-filter-empty-not-load-failure"
              >
                {GOVERNANCE_APPROVAL_STATUS_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE}
              </p>
              <Link
                className="text-al-link hover:underline"
                href={governanceApprovalQueueFilterHrefFromSearch(searchParams, { approvalStatus: null })}
                data-testid="governance-approval-status-filter-clear"
              >
                Clear status filter
              </Link>
              <GovernanceWorkflowApprovalsStatusFilterEmptyPartialHonesty />
            </div>
          }
        />
      ) : null}

      <GovernanceWorkflowApprovalsQueueChrome
        approvalsCount={filteredApprovals.length}
        mutationDisabledHintId={mutationDisabledHintId}
        mutationDisabledReason={mutationDisabledReason}
      />

      {continueLastRequest !== null ? (
        <ApprovalQueueContinueLastViewedRow
          target={continueLastRequest}
          onOpen={(approvalRequestId) => {
            openApprovalRequest(approvalRequestId);
            const row = approvals.find((approval) => approval.approvalRequestId === approvalRequestId);
            setPendingReview({
              approvalRequestId,
              mode: "approve",
              runId: row?.runId ?? "",
            });
            setPendingPromote(null);
            pendingPromoteRequestRef.current = null;
          }}
        />
      ) : null}

      {triageFirstPending !== null ? (
        <ApprovalQueueTriageFirstPendingStrip
          target={triageFirstPending}
          onReviewDecision={(approvalRequestId) => {
            setPendingReview({
              approvalRequestId,
              mode: "approve",
              runId: triageFirstPending.runId,
            });
            setPendingPromote(null);
            pendingPromoteRequestRef.current = null;
          }}
        />
      ) : null}

      {filteredApprovals.map((row) => (
        <Card
          key={row.approvalRequestId}
          data-testid="governance-approval-request-row"
          data-approval-request-id={row.approvalRequestId}
        >
          <GovernanceWorkflowApprovalsQueueRow row={row} buyerPolishedShell={buyerPolishedShell} />
          <GovernanceWorkflowApprovalsMutations row={row} {...mutationProps} />
        </Card>
      ))}
    </div>
  );
}
