"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { MutationReversibilityNotice } from "@/components/operator/MutationReversibilityNotice";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Stored on the governance record when the approver leaves the note field empty (TB-501). */
export const GOVERNANCE_QUICK_APPROVE_DEFAULT_REVIEW_COMMENT =
  "Approved — no critical or high findings present at time of review.";

export type GovernanceQuickApproveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvalSubject: string;
  runId: string;
  busy?: boolean;
  errorMessage?: string | null;
  onConfirm: (approverNote: string) => void;
};

/**
 * Confirmation step before one-click governance quick approve — subject, risk snapshot, optional approver note.
 */
export function GovernanceQuickApproveDialog({
  open,
  onOpenChange,
  approvalSubject,
  runId,
  busy = false,
  errorMessage = null,
  onConfirm,
}: GovernanceQuickApproveDialogProps) {
  const [approverNote, setApproverNote] = useState("");

  useEffect(() => {
    if (!open) {
      setApproverNote("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="governance-quick-approve-dialog">
        <DialogHeader>
          <DialogTitle>Confirm resolve outcomes</DialogTitle>
          <DialogDescription>
            Review the approval subject and confirm that no critical or high findings block this decision.
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className={OPERATOR_TYPOGRAPHY.helper}>Approval subject</dt>
            <dd className="mt-1 font-medium text-neutral-900 dark:text-neutral-100">{approvalSubject}</dd>
          </div>
          <div>
            <dt className={OPERATOR_TYPOGRAPHY.helper}>Review run ID</dt>
            <dd className="mt-1 font-mono text-xs text-neutral-700 dark:text-neutral-300">{runId}</dd>
          </div>
          <div>
            <dt className={OPERATOR_TYPOGRAPHY.helper}>Finding snapshot</dt>
            <dd className="mt-1 text-neutral-800 dark:text-neutral-200">
              No critical or high findings detected in the governance lineage snapshot.
            </dd>
          </div>
        </dl>

        <MutationReversibilityNotice mutationId="governance_quick_approve" />

        {errorMessage !== null && errorMessage.trim().length > 0 ? (
          <OperatorMutationInlineError
            message={errorMessage}
            testId="governance-quick-approve-inline-error"
          />
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="governance-quick-approve-note">Approver note (optional)</Label>
          <Textarea
            id="governance-quick-approve-note"
            rows={3}
            value={approverNote}
            disabled={busy}
            placeholder="Add context for the audit record, or leave blank to use the default approval statement."
            onChange={(event) => setApproverNote(event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy}
            data-testid="governance-quick-approve-confirm"
            onClick={() => onConfirm(approverNote)}
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                Confirming…
              </span>
            ) : (
              "Confirm approval"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
