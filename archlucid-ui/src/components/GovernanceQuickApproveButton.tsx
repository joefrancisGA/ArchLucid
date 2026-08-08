"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import {

  GOVERNANCE_QUICK_APPROVE_DEFAULT_REVIEW_COMMENT,

  GovernanceQuickApproveDialog,

} from "@/components/GovernanceQuickApproveDialog";

import { batchReviewGovernanceApprovalRequests, getApprovalRequestLineage } from "@/lib/api";

import { toApiLoadFailure } from "@/lib/api-load-failure";

import { approvalLineageBlocksQuickApprove } from "@/lib/governance-quick-approve-lineage";

import { BUYER_GOVERNANCE_QUICK_APPROVE_LABEL } from "@/lib/buyer-polish-copy";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { showError, showSuccess } from "@/lib/toast";

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

  const [phase, setPhase] = useState<LineagePhase>("loading");

  const [blockedBySeverity, setBlockedBySeverity] = useState<boolean>(true);

  const [busy, setBusy] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);

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

  const submitApproval = useCallback(

    async (approverNote: string) => {

      setBusy(true);

      try {

        const res = await batchReviewGovernanceApprovalRequests({

          approvalRequestIds: [approvalRequestId],

          decision: "approve",

          reviewComment: resolveQuickApproveReviewComment(approverNote),

          reviewedBy: reviewedBy.trim().length > 0 ? reviewedBy.trim() : undefined,

        });

        const row = res.results?.find((r) => r.approvalRequestId === approvalRequestId) ?? res.results?.[0];

        if (row?.succeeded !== true) {

          showError(row?.message ?? "Quick approve failed.", row?.errorCode ?? undefined);

          return;

        }

        showSuccess("Quick approve completed.");

        setDialogOpen(false);

        await onApproved();

      } catch (e) {

        showError(toApiLoadFailure(e).message);

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

        title="Checking finding severities from governance lineage…"

      >

        Checking risk…

      </Button>

    );

  }

  return (

    <>

      <Button

        type="button"

        size="sm"

        variant="secondary"

        disabled={busy}

        data-testid="governance-quick-approve"

        title="Approve when lineage shows no Critical or High (Error) findings. Opens a confirmation dialog before submitting."

        onClick={() => setDialogOpen(true)}

      >

        {busy ? "Approving…" : isBuyerPolishedOperatorShellEnv() ? BUYER_GOVERNANCE_QUICK_APPROVE_LABEL : "Quick approve"}

      </Button>

      <GovernanceQuickApproveDialog

        open={dialogOpen}

        onOpenChange={setDialogOpen}

        approvalSubject={approvalSubject}

        runId={runId}

        busy={busy}

        onConfirm={(approverNote) => void submitApproval(approverNote)}

      />

    </>

  );

}

