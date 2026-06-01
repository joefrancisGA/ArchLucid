"use client";

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
      const message = e instanceof Error ? e.message : "Failed to record run disposition.";
      setErrorMessage(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {normalizedExisting.length > 0 ? (
        <p className="m-0 text-sm text-al-text-secondary">
          Recorded disposition: <span className="font-medium text-al-text-primary">{normalizedExisting}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="default"
          disabled={hasCommitBlockingFailures || busy}
          title={
            hasCommitBlockingFailures
              ? "Resolve commit-blocking finding coverage before approving this run."
              : undefined
          }
          onClick={() => setPending("Approved")}
        >
          Approve run
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setPending("Rejected")}>
          Reject run
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
        <p className="m-0 text-xs text-amber-800 dark:text-amber-200">
          Approve is blocked while commit-blocking finding coverage failures are open.
        </p>
      ) : null}
      {errorMessage ? <p className="m-0 text-sm text-red-700 dark:text-red-300">{errorMessage}</p> : null}

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm run disposition</DialogTitle>
            <DialogDescription>
              Record a run-level governance decision for operators and audit. This does not replace per-finding
              dispositions.
            </DialogDescription>
          </DialogHeader>
          <label className="block text-sm">
            <span className="font-medium text-al-text-primary">Rationale (optional)</span>
            <textarea
              className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              rows={4}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
            />
          </label>
          <DialogFooter className="gap-2 sm:gap-0">
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
