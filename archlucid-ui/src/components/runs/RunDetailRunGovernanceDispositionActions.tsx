"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { recordRunOperatorGovernanceDisposition } from "@/lib/api/architecture-runs";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

export type RunDetailRunGovernanceDispositionActionsProps = {
  readonly runId: string;
  readonly hasCommitBlockingFailures: boolean;
  readonly existingDecision?: string | null;
};

type PendingDecision = "Approved" | "Rejected" | "RequestRemediation";

/** TB-112: run-level approve / reject / request-remediation from run detail. */
export function RunDetailRunGovernanceDispositionActions(
  props: RunDetailRunGovernanceDispositionActionsProps,
): ReactElement | null {
  const { runId, hasCommitBlockingFailures, existingDecision = null } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const router = useRouter();
  const [pending, setPending] = useState<PendingDecision | null>(null);
  const [rationale, setRationale] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (buyerPolishedShell)
    return null;

  const normalizedExisting = (existingDecision ?? "").trim();

  async function onConfirm(): Promise<void> {
    if (pending === null)
      return;

    setBusy(true);
    setErrorMessage(null);

    try {
      await recordRunOperatorGovernanceDisposition(runId, {
        decision: pending,
        rationale: rationale.trim().length > 0 ? rationale.trim() : null,
      });
      setPending(null);
      setRationale("");
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to record review disposition.";
      setErrorMessage(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {normalizedExisting.length > 0 ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Recorded disposition: <span className="font-medium text-al-text-primary">{normalizedExisting}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={hasCommitBlockingFailures || busy}
          aria-describedby={hasCommitBlockingFailures ? "run-governance-disposition-approve-blocked-hint" : undefined}
          onClick={() => setPending("Approved")}
        >
          Approve review
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setPending("Rejected")}>
          Reject review
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setPending("RequestRemediation")}
        >
          Request remediation
        </Button>
      </div>
      {hasCommitBlockingFailures ? (
        <p
          id="run-governance-disposition-approve-blocked-hint"
          className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}
        >
          Approve is blocked while commit-blocking finding coverage failures are open.
        </p>
      ) : null}
      {errorMessage ? <p className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.body)}>{errorMessage}</p> : null}

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm review disposition</DialogTitle>
            <DialogDescription>
              Record a review-level approval decision for operators and audit. This does not replace per-finding
              dispositions.
            </DialogDescription>
          </DialogHeader>
          <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
            <span className="font-medium text-al-text-primary">Rationale (optional)</span>
            <textarea
              className={cn("mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900", OPERATOR_TYPOGRAPHY.body)}
              rows={4}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy || pending === null} onClick={() => void onConfirm()}>
              Confirm {pending ?? ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
