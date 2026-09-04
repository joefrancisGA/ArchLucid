import { cn } from "@/lib/utils";
import { GovernanceQuickApproveButton } from "@/components/governance/GovernanceQuickApproveButton";
import { MutationReversibilityNotice } from "@/components/operator/MutationReversibilityNotice";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  enterpriseMutationControlDisabledTitle,
  governanceWorkflowApproveButtonLabelReaderRank,
  governanceWorkflowPendingReviewReaderNote,
  governanceWorkflowPendingReviewReaderNoteBuyerPolished,
  governanceWorkflowRejectButtonLabelReaderRank,
  governanceWorkflowReviewSubmitButtonLabelReaderRank,
} from "@/lib/enterprise-controls-context-copy";
import {
  GOVERNANCE_WORKFLOW_RELEASE_TO_ENVIRONMENT_BUTTON,
  GOVERNANCE_WORKFLOW_RELEASE_TO_ENVIRONMENT_BUTTON_READER,
} from "@/lib/governance/governance-workflow-release-copy";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import { writeApprovalQueueLastViewedRequestId } from "@/lib/resolve-continue-last-approval-request";
import { governanceApprovalCardTitle, type GovernanceWorkflowPendingReview } from "./governance-workflow-helpers";
import type { MutableRefObject } from "react";

export type GovernanceWorkflowApprovalsMutationsProps = {
  readonly row: GovernanceApprovalRequest;
  readonly buyerPolishedShell: boolean;
  readonly canMutateWorkflow: boolean;
  readonly compactSupportingRows: boolean;
  readonly pendingReview: GovernanceWorkflowPendingReview | null;
  readonly setPendingReview: (v: GovernanceWorkflowPendingReview | null) => void;
  readonly reviewedBy: string;
  readonly setReviewedBy: (v: string) => void;
  readonly reviewComment: string;
  readonly setReviewComment: (v: string) => void;
  readonly reviewBusy: boolean;
  readonly onConfirmReview: () => void | Promise<void>;
  readonly workflowActor: string;
  readonly refreshIfActive: () => void | Promise<void>;
  readonly pendingPromote: { manifestId: string; targetEnv: string } | null;
  readonly setPendingPromote: (v: { manifestId: string; targetEnv: string } | null) => void;
  readonly pendingPromoteRequestRef: MutableRefObject<GovernanceApprovalRequest | null>;
  readonly mutationDisabledHintId: string;
  readonly mutationDisabledReason: WhyDisabledCtaReason | null;
};

export function GovernanceWorkflowApprovalsMutations(props: GovernanceWorkflowApprovalsMutationsProps) {
  const {
    row,
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
  } = props;

  return (
    <>
      {!compactSupportingRows && pendingReview?.approvalRequestId === row.approvalRequestId ? (
        <div className="px-6 pb-4">
          <div className="mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
            <p className={cn("mb-3 font-medium", OPERATOR_TYPOGRAPHY.body)}>
              {pendingReview.mode === "approve" ? "Approve request" : "Reject request"}
            </p>
            <MutationReversibilityNotice
              mutationId={
                pendingReview.mode === "approve" ? "governance_workflow_approve" : "governance_workflow_reject"
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
                  aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
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
        </div>
      ) : null}
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
                aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
                onClick={() => {
                  writeApprovalQueueLastViewedRequestId(row.approvalRequestId);
                  setPendingReview({
                    approvalRequestId: row.approvalRequestId,
                    mode: "approve",
                    runId: row.runId,
                  });
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
                aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
                onClick={() => {
                  writeApprovalQueueLastViewedRequestId(row.approvalRequestId);
                  setPendingReview({
                    approvalRequestId: row.approvalRequestId,
                    mode: "reject",
                    runId: row.runId,
                  });
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
                aria-describedby={mutationDisabledReason === null ? undefined : mutationDisabledHintId}
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
    </>
  );
}
