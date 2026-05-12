import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { GovernanceQuickApproveButton } from "@/components/GovernanceQuickApproveButton";
import { OperatorEmptyState, OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  enterpriseMutationControlDisabledTitle,
  governanceWorkflowApproveButtonLabelReaderRank,
  governanceWorkflowNoApprovalsOperatorHint,
  governanceWorkflowNoApprovalsReaderHint,
  governanceWorkflowPendingReviewReaderNote,
  governanceWorkflowPendingReviewReaderNoteBuyerPolished,
  governanceWorkflowPromoteButtonLabelReaderRank,
  governanceWorkflowRejectButtonLabelReaderRank,
  governanceWorkflowReviewSubmitButtonLabelReaderRank,
} from "@/lib/enterprise-controls-context-copy";
import {
  governanceNoApprovalsGettingStartedOperator,
  governanceNoApprovalsGettingStartedReader,
} from "@/lib/governance-workflow-empty-guidance";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";
import type { MutableRefObject } from "react";
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
  listFailure: ApiLoadFailureState | null;
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
    listsLoading,
    activeRunId,
    approvals,
    listFailure,
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

  return (
    <div className="mt-6 grid gap-4">
      {listsLoading && activeRunId !== null && approvals.length === 0 ? (
        <OperatorLoadingNotice>
          <strong>Loading workflow data.</strong>
          <p className="mt-2 text-sm">Loading approval history and workflow status for this review.</p>
        </OperatorLoadingNotice>
      ) : null}

      {!listsLoading && activeRunId !== null && approvals.length === 0 && listFailure === null ? (
        <OperatorEmptyState title="No approval requests for this review">
          <div className="grid gap-3">
            <p className="text-sm">
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

      {buyerPolishedShell && approvals.length > 0
        ? null
        : approvals.map((row) => (
            <Card key={row.approvalRequestId}>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base font-semibold">{governanceApprovalCardTitle(row)}</CardTitle>
                  <CardDescription>
                    {governanceEnvironmentPairDisplay(row.sourceEnvironment, row.targetEnvironment)}
                  </CardDescription>
                  <p className="sr-only">Approval request id {row.approvalRequestId}</p>
                </div>
                <StatusPill status={row.status} domain="governance" className="text-xs" />
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">Requested by</span> {row.requestedBy}
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">Requested</span>{" "}
                  {formatGovernanceBusinessInstant(row.requestedUtc)}
                </div>
                {row.requestComment ? (
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">Comment</span> {row.requestComment}
                  </div>
                ) : null}
                {row.reviewedBy ? (
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">Reviewed by</span> {row.reviewedBy}
                    {row.reviewedUtc ? ` · ${formatGovernanceBusinessInstant(row.reviewedUtc)}` : null}
                  </div>
                ) : null}
                {row.reviewComment ? (
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">Review comment</span> {row.reviewComment}
                  </div>
                ) : null}

                {pendingReview?.approvalRequestId === row.approvalRequestId ? (
                  <div className="mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
                    <p className="mb-3 text-sm font-medium">
                      {pendingReview.mode === "approve" ? "Approve request" : "Reject request"}
                    </p>
                    {!canMutateWorkflow ? (
                      <p className="mb-3 text-xs text-neutral-600 dark:text-neutral-400" role="note">
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
              <CardFooter className="flex flex-wrap gap-2">
                {row.status === "Submitted" ? (
                  <>
                    <GovernanceQuickApproveButton
                      approvalRequestId={row.approvalRequestId}
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
                      className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50"
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
                      {canMutateWorkflow ? "Promote" : governanceWorkflowPromoteButtonLabelReaderRank}
                    </Button>
                  )
                ) : null}
              </CardFooter>
            </Card>
          ))}
    </div>
  );
}
