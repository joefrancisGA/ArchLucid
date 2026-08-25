import { cn } from "@/lib/utils";
import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { GovernanceQuickApproveButton } from "@/components/governance/GovernanceQuickApproveButton";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { GovernanceStatusTag } from "@/components/governance/GovernanceStatusTag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MutationReversibilityNotice } from "@/components/operator/MutationReversibilityNotice";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
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
import { formatActionActorName } from "@/lib/action-actor-display";
import { buyerGovernanceWorkflowStatusLabel } from "@/lib/buyer/buyer-governance-workflow-status-labels";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";
import { useMemo, type MutableRefObject } from "react";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_WORKFLOW_NO_APPROVALS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import {
  formatGovernanceBusinessInstant,
  governanceApprovalCardTitle,
  governanceEnvironmentPairDisplay,
} from "./governance-workflow-helpers";
import type { GovernanceWorkflowPendingReview } from "./governance-workflow-helpers";
import { ApprovalQueueTriageFirstPendingStrip } from "./ApprovalQueueTriageFirstPendingStrip";
import { resolveApprovalQueueTriageFirstPending } from "@/lib/governance/resolve-approval-queue-triage-first-pending";

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
  const mutationDisabledHintId = "governance-workflow-approvals-mutate-disabled-hint";
  const mutationDisabledReason = canMutateWorkflow ? null : whyDisabledEnterpriseMutationControl();
  const triageFirstPending = useMemo(
    () => resolveApprovalQueueTriageFirstPending(approvals),
    [approvals],
  );

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

      {approvals.length > 0 ? (
        <WhyDisabledCtaHint
          id={mutationDisabledHintId}
          reason={mutationDisabledReason}
          testId={mutationDisabledHintId}
        />
      ) : null}

      {triageFirstPending !== null ? (
        <ApprovalQueueTriageFirstPendingStrip
          target={triageFirstPending}
          onReviewDecision={(approvalRequestId) => {
            setPendingReview({ approvalRequestId, mode: "approve" });
            setPendingPromote(null);
            pendingPromoteRequestRef.current = null;
          }}
        />
      ) : null}

      {approvals.map((row) => (
            <Card key={row.approvalRequestId} data-testid="governance-approval-request-row" data-approval-request-id={row.approvalRequestId}>
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
                          aria-describedby={
                            mutationDisabledReason === null ? undefined : mutationDisabledHintId
                          }
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
                      aria-describedby={
                        mutationDisabledReason === null ? undefined : mutationDisabledHintId
                      }
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
                      variant="destructive"
                      disabled={!canMutateWorkflow}
                      aria-describedby={
                        mutationDisabledReason === null ? undefined : mutationDisabledHintId
                      }
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
                      aria-describedby={
                        mutationDisabledReason === null ? undefined : mutationDisabledHintId
                      }
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
