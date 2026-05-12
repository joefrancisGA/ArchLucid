"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { batchReviewGovernanceApprovalRequests, getApprovalRequestLineage } from "@/lib/api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { approvalLineageBlocksQuickApprove } from "@/lib/governance-quick-approve-lineage";
import { showError, showSuccess } from "@/lib/toast";

type LineagePhase = "loading" | "ready" | "error";

export type GovernanceQuickApproveButtonProps = {
  approvalRequestId: string;
  status: string;
  /** ExecuteAuthority floor — same as `useEnterpriseMutationCapability()`. */
  canExecute: boolean;
  /** Optional display name; API falls back to authenticated actor when empty. */
  reviewedBy: string;
  onApproved: () => void | Promise<void>;
};

/**
 * One-click approve via batch-review when lineage top findings show no Critical / High (Error) severities.
 */
export function GovernanceQuickApproveButton({
  approvalRequestId,
  status,
  canExecute,
  reviewedBy,
  onApproved,
}: GovernanceQuickApproveButtonProps) {
  const [phase, setPhase] = useState<LineagePhase>("loading");
  const [blockedBySeverity, setBlockedBySeverity] = useState<boolean>(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!canExecute || status !== "Submitted") {
      return;
    }

    let cancelled = false;

    setPhase("loading");
    setBlockedBySeverity(true);

    void (async () => {
      try {
        const lineage = await getApprovalRequestLineage(approvalRequestId);

        if (cancelled) {
          return;
        }

        const findings = lineage.topFindings ?? [];
        const blocks = approvalLineageBlocksQuickApprove(findings);

        setBlockedBySeverity(blocks);
        setPhase("ready");
      } catch {
        if (cancelled) {
          return;
        }

        setPhase("error");
        setBlockedBySeverity(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [approvalRequestId, canExecute, status]);

  const onClick = useCallback(async () => {
    setBusy(true);

    try {
      const res = await batchReviewGovernanceApprovalRequests({
        approvalRequestIds: [approvalRequestId],
        decision: "approve",
        reviewComment: "Quick approve — no Critical/High findings in governance lineage snapshot.",
        reviewedBy: reviewedBy.trim().length > 0 ? reviewedBy.trim() : undefined,
      });
      const row = res.results?.find((r) => r.approvalRequestId === approvalRequestId) ?? res.results?.[0];

      if (row?.succeeded !== true) {
        showError(row?.message ?? "Quick approve failed.", row?.errorCode ?? undefined);

        return;
      }

      showSuccess("Quick approve completed.");
      await onApproved();
    } catch (e) {
      showError(toApiLoadFailure(e).message);
    } finally {
      setBusy(false);
    }
  }, [approvalRequestId, onApproved, reviewedBy]);

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
        title="Checking finding severities from governance lineage…"
      >
        Checking risk…
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      disabled={busy}
      data-testid="governance-quick-approve"
      title="Approve immediately (batch-review). Only available when lineage shows no Critical or High (Error) findings in the snapshot."
      onClick={() => void onClick()}
    >
      {busy ? "Approving…" : "Quick approve"}
    </Button>
  );
}
