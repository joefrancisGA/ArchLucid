import { cn } from "@/lib/utils";
import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { cn } from "@/lib/utils";
import { GovernanceQuickApproveButton } from "@/components/GovernanceQuickApproveButton";
import { cn } from "@/lib/utils";
import { OperatorEmptyState, OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/StatusPill";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
import { cn } from "@/lib/utils";
import {
  governanceNoApprovalsGettingStartedOperator,
  governanceNoApprovalsGettingStartedReader,
} from "@/lib/governance-workflow-empty-guidance";
import { cn } from "@/lib/utils";
import { buyerSafeGovernanceActorLabel } from "@/lib/buyer-demo-persona-labels";
import { cn } from "@/lib/utils";
import { buyerGovernanceWorkflowStatusLabel } from "@/lib/buyer-governance-workflow-status-labels";
import { cn } from "@/lib/utils";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { cn } from "@/lib/utils";
import type { GovernanceApprovalRequest } from "@/types/governance-workflow";
import { cn } from "@/lib/utils";
import type { MutableRefObject } from "react";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  formatGovernanceBusinessInstant,
  governanceApprovalCardTitle,
  governanceEnvironmentPairDisplay,
} from "./governance-workflow-helpers";
import { cn } from "@/lib/utils";
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
          <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Loading approval history and workflow status for this review.
          </p>
        </OperatorLoadingNotice>
      ) : null}

      {!listsLoading && activeRunId !== null && approvals.length === 0 && listFailure === null ? (
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

      {buyerPolishedShell && approvals.length > 0
        ? null
        : approvals.map((row) => (
            <Card key={row.approvalRequestId}>
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

                {pendingReview?.approvalRequestId === row.approvalRequestId ? (
                  <div className="mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
                    <p className={cn("mb-3 font-medium", OPERATOR_TYPOGRAPHY.body)}>
                      {pendingReview.mode === "approve" ? "Approve request" : "Reject request"}
                    </p>
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
