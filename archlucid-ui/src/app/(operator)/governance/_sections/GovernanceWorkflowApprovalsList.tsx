import { cn } from "@/lib/utils";
import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { GovernanceQuickApproveButton } from "@/components/GovernanceQuickApproveButton";
import { OperatorEmptyState, OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MutationReversibilityNotice } from "@/components/operator/MutationReversibilityNotice";
import {
  enterpriseMutationControlDisabledTitle,
  governanceWorkflowApproveButtonLabelReaderRank,
  governanceWorkflowNoApprovalsOperatorHint,
  governanceWorkflowNoApprovalsReaderHint,
  governanceWorkflowPendingReviewReaderNote,
  governanceWorkflowPendingReviewReaderNoteBuyerPolished,
  governanceWorkflowRejectButtonLabelReaderRank,
  governanceWorkflowReviewSubmitButtonLabelReaderRank,
} from "@/lib/enterprise-controls-context-copy";
import {
  governanceNoApprovalsGettingStartedOperator,
  governanceNoApprovalsGettingStartedReader,
} from "@/lib/governance/governance-workflow-empty-guidance";
import type { GovernanceApprovalWorkflowState } from "@/app/(operator)/governance/_sections/governance-approval-workflow-state";
import {
  GOVERNANCE_WORKFLOW_RELEASE_TO_ENVIRONMENT_BUTTON,
  GOVERNANCE_WORKFLOW_RELEASE_TO_ENVIRONMENT_BUTTON_READER,
} from "@/lib/governance/governance-workflow-release-copy";
import { buyerSafeGovernanceActorLabel } from "@/lib/buyer/buyer-demo-persona-labels";
import { buyerGovernanceWorkflowStatusLabel } from "@/lib/buyer/buyer-governance-workflow-status-labels";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";
import type { MutableRefObject } from "react";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatGovernanceBusinessInstant,
  governanceApprovalCardTitle,
  governanceEnvironmentPairDisplay,
} from "./governance-workflow-helpers";
import type { GovernanceWorkflowPendingReview } from "./governance-workflow-helpers";

type GovernanceWorkflowApprovalsListProps = {
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
  const {
    buyerPolishedShell,
    canMutateWorkflow,
    approvals,
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

  return (
    <div className="mt-6 grid gap-4">
      {workflowState.phase === "loading" ? (
        <OperatorLoadingNotice>
          <strong>Loading workflow data.</strong>
          <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Loading approval history and workflow status for this review.
          </p>
        </OperatorLoadingNotice>
      ) : null}

      {workflowState.phase === "no_requests" && listFailure === null ? (
        <OperatorEmptyState title="No approval requests for this review">
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
        </OperatorEmptyState>
      ) : null}

      {approvals.map((row) => (
            <Card key={row.approvalRequestId} data-testid="governance-approval-request-row">
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{governanceApprovalCardTitle(row)}</CardTitle>
                  <CardDescription>
                    {governanceEnvironmentPairDisplay(row.sourceEnvironment, row.targetEnvironment)}
                  </CardDescription>
                  <p className="sr-only">Approval request id {row.approvalRequestId}</p>
                </div>
                <StatusPill
                  status={buyerPolishedShell ? buyerGovernanceWorkflowStatusLabel(row.status) : row.status}
                  domain="governance"
                  className={OPERATOR_TYPOGRAPHY.badge}
                  uppercase={!buyerPolishedShell}
                />
              </CardHeader>
              <CardContent className={cn("grid gap-2", OPERATOR_TYPOGRAPHY.body)}>
                <div>
                  <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Requested by</span>{" "}
                  {buyerPolishedShell ? buyerSafeGovernanceActorLabel(row.requestedBy) : row.requestedBy}
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
                {row.reviewedBy ? (
                  <div>
                    <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Reviewed by</span>{" "}
                    {buyerPolishedShell ? buyerSafeGovernanceActorLabel(row.reviewedBy) : row.reviewedBy}
                    {row.reviewedUtc ? ` · ${formatGovernanceBusinessInstant(row.reviewedUtc)}` : null}
                  </div>
                ) : null}
                {row.reviewComment ? (
                  <div>
                    <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Review comment</span>{" "}
                    {row.reviewComment}
                  </div>
                ) : null}

                {!compactSupportingRows && pendingReview?.approvalRequestId === row.approvalRequestId ? (
                  <div className="mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
                    <p className={cn("mb-3 font-medium", OPERATOR_TYPOGRAPHY.body)}>
                      {pendingReview.mode === "approve" ? "Approve request" : "Reject request"}
                    </p>
                    <MutationReversibilityNotice
                      mutationId={
                        pendingReview.mode === "approve"
                          ? "governance_workflow_approve"
                          : "governance_workflow_reject"
                      }
                      className="mb-3"
                    />
                    {!canMutateWorkflow ? (
                      <p className={cn("mb-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="note">
                        {buyerPolishedShell
                          ? governanceWorkflowPendingReviewReaderNoteBuyerPolished
                          : governanceWorkflowPendingReviewReaderNote}
                      </p>
                    ) : null}
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor={`review-by-${row.approvalRequestId}`}>Reviewed by</Label>
                        <Input
                          id={`review-by-${row.approvalRequestId}`}
                          value={reviewedBy}
                          onChange={(e) => setReviewedBy(e.target.value)}
                          autoComplete="username"
                          readOnly={!canMutateWorkflow}
                          title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`review-comment-${row.approvalRequestId}`}>Review comment (optional)</Label>
                        <Textarea
                          id={`review-comment-${row.approvalRequestId}`}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={2}
                          readOnly={!canMutateWorkflow}
                          title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={canMutateWorkflow ? "default" : "outline"}
                          onClick={() => void onConfirmReview()}
                          disabled={reviewBusy || !canMutateWorkflow}
                          title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
                        >
                          {reviewBusy
                            ? "Saving…"
                            : canMutateWorkflow
                              ? "Submit"
                              : governanceWorkflowReviewSubmitButtonLabelReaderRank}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPendingReview(null);
                            setReviewedBy("");
                            setReviewComment("");
                          }}
                          disabled={reviewBusy}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
              {compactSupportingRows ? null : (
              <CardFooter className="flex flex-wrap gap-2">
                {row.status === "Submitted" ? (
                  <>
                    <GovernanceQuickApproveButton
                      approvalRequestId={row.approvalRequestId}
                      runId={row.runId}
                      approvalSubject={governanceApprovalCardTitle(row)}
                      status={row.status}
                      canExecute={canMutateWorkflow}
                      reviewedBy={workflowActor}
                      onApproved={() => void refreshIfActive()}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant={canMutateWorkflow ? "default" : "outline"}
                      disabled={!canMutateWorkflow}
                      title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
                      onClick={() => {
                        setPendingReview({ approvalRequestId: row.approvalRequestId, mode: "approve" });
                        setPendingPromote(null);
                        pendingPromoteRequestRef.current = null;
                      }}
                    >
                      {canMutateWorkflow ? "Approve" : governanceWorkflowApproveButtonLabelReaderRank}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-rose-600/40 text-al-text-primary hover:bg-[var(--al-layer-hover)] dark:border-rose-800/50"
                      disabled={!canMutateWorkflow}
                      title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
                      onClick={() => {
                        setPendingReview({ approvalRequestId: row.approvalRequestId, mode: "reject" });
                        setPendingPromote(null);
                        pendingPromoteRequestRef.current = null;
                      }}
                    >
                      {canMutateWorkflow ? "Reject" : governanceWorkflowRejectButtonLabelReaderRank}
                    </Button>
                  </>
                ) : null}
                {row.status === "Approved" ? (
                  buyerPolishedShell ? null : (
                    <Button
                      type="button"
                      size="sm"
                      variant={canMutateWorkflow ? "default" : "outline"}
                      className={
                        canMutateWorkflow
                          ? "bg-violet-600 text-white hover:bg-violet-600/90 dark:bg-violet-600 dark:hover:bg-violet-600/90"
                          : undefined
                      }
                      disabled={pendingPromote !== null || !canMutateWorkflow}
                      title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
                      onClick={() => {
                        pendingPromoteRequestRef.current = row;
                        setPendingPromote({
                          manifestId: row.manifestVersion,
                          targetEnv: row.targetEnvironment,
                        });
                        setPendingReview(null);
                      }}
                    >
                      {canMutateWorkflow
                        ? GOVERNANCE_WORKFLOW_RELEASE_TO_ENVIRONMENT_BUTTON
                        : GOVERNANCE_WORKFLOW_RELEASE_TO_ENVIRONMENT_BUTTON_READER}
                    </Button>
                  )
                ) : null}
              </CardFooter>
              )}
            </Card>
          ))}
    </div>
  );
}
