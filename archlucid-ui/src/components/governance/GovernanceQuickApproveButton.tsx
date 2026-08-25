"use client";

import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  GOVERNANCE_QUICK_APPROVE_DEFAULT_REVIEW_COMMENT,
  GovernanceQuickApproveDialog,
} from "@/components/governance/GovernanceQuickApproveDialog";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { useApprovalRequestLineageQuery } from "@/hooks/use-approval-request-lineage-query";
import { batchReviewGovernanceApprovalRequests } from "@/lib/api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { approvalLineageBlocksQuickApprove } from "@/lib/governance/governance-quick-approve-lineage";
import {
  GOVERNANCE_QUICK_APPROVE_FAILURE_MESSAGE,
  GOVERNANCE_QUICK_APPROVE_SUCCESS_MESSAGE,
} from "@/lib/governance/governance-mutation-outcome-copy";
import { BUYER_GOVERNANCE_QUICK_APPROVE_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type LineagePhase = "loading" | "ready" | "error";

export type GovernanceQuickApproveButtonProps = {
  approvalRequestId: string;
  runId: string;
  approvalSubject: string;
  status: string;
  /** ExecuteAuthority floor — same as `useOperateCapability()`. */
  canExecute: boolean;
  /** Optional display name; API falls back to authenticated actor when empty. */
  reviewedBy: string;
  onApproved: () => void | Promise<void>;
};

function resolveQuickApproveReviewComment(approverNote: string): string {
  const trimmed = approverNote.trim();

  if (trimmed.length > 0) {
    return trimmed;
  }

  return GOVERNANCE_QUICK_APPROVE_DEFAULT_REVIEW_COMMENT;
}

/**
 * Quick approve via batch-review when lineage top findings show no Critical / High (Error) severities.
 * Requires a confirmation dialog before the approval is submitted.
 */
export function GovernanceQuickApproveButton({
  approvalRequestId,
  runId,
  approvalSubject,
  status,
  canExecute,
  reviewedBy,
  onApproved,
}: GovernanceQuickApproveButtonProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const lineageQuery = useApprovalRequestLineageQuery(approvalRequestId, {
    enabled: canExecute && status === "Submitted",
  });
  const phase: LineagePhase = !canExecute || status !== "Submitted"
    ? "ready"
    : lineageQuery.isPending
      ? "loading"
      : lineageQuery.isError
        ? "error"
        : "ready";
  const blockedBySeverity = useMemo(() => {
    if (!canExecute || status !== "Submitted" || lineageQuery.data === undefined) {
      return true;
    }

    return approvalLineageBlocksQuickApprove(lineageQuery.data.topFindings ?? []);
  }, [canExecute, lineageQuery.data, status]);

  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogErrorMessage, setDialogErrorMessage] = useState<string | null>(null);

  const submitApproval = useCallback(
    async (approverNote: string) => {
      setBusy(true);
      setDialogErrorMessage(null);

      try {
        const res = await batchReviewGovernanceApprovalRequests({
          approvalRequestIds: [approvalRequestId],
          decision: "approve",
          reviewComment: resolveQuickApproveReviewComment(approverNote),
          reviewedBy: reviewedBy.trim().length > 0 ? reviewedBy.trim() : undefined,
        });

        const row = res.results?.find((r) => r.approvalRequestId === approvalRequestId) ?? res.results?.[0];

        if (row?.succeeded !== true) {
          setDialogErrorMessage(row?.message ?? GOVERNANCE_QUICK_APPROVE_FAILURE_MESSAGE);

          return;
        }

        setDialogOpen(false);
        setSuccessMessage(GOVERNANCE_QUICK_APPROVE_SUCCESS_MESSAGE);
        await onApproved();
      } catch (e) {
        setDialogErrorMessage(toApiLoadFailure(e).message);
      } finally {
        setBusy(false);
      }
    },
    [approvalRequestId, onApproved, reviewedBy],
  );

  if (!canExecute || status !== "Submitted") {
    return null;
  }

  if (phase === "error" || (phase === "ready" && blockedBySeverity)) {
    return null;
  }

  if (phase === "loading") {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled
        aria-busy="true"
        data-testid="governance-quick-approve-loading"
      >
        Checking risk…
      </Button>
    );
  }

  return (
    <>
      {successMessage !== null ? (
        <OperatorSuccessCallout
          message={successMessage}
          testId="governance-quick-approve-success-callout"
          className="mb-2"
          onDismiss={() => setSuccessMessage(null)}
        />
      ) : null}

      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={busy}
        data-testid="governance-quick-approve"
        aria-describedby="governance-quick-approve-help"
        onClick={() => {
          setDialogErrorMessage(null);
          setDialogOpen(true);
        }}
      >
        {busy ? "Approving…" : isBuyerPolishedOperatorShellEnv() ? BUYER_GOVERNANCE_QUICK_APPROVE_LABEL : "Quick approve"}
      </Button>
      <p
        id="governance-quick-approve-help"
        className={cn("sr-only", OPERATOR_TYPOGRAPHY.helper)}
      >
        Approve when lineage shows no Critical or High (Error) findings. Opens a confirmation dialog before submitting.
      </p>

      <GovernanceQuickApproveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        approvalSubject={approvalSubject}
        runId={runId}
        busy={busy}
        errorMessage={dialogErrorMessage}
        onConfirm={(approverNote) => void submitApproval(approverNote)}
      />
    </>
  );
}
