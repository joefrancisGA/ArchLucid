"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement, type SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { recordRunOperatorGovernanceDisposition } from "@/lib/api/architecture-runs";
import { awaitMinimumVisibleDuration } from "@/lib/await-minimum-visible-duration";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  runGovernanceDispositionConfirmHrefFromSearch,
  runGovernanceDispositionFromUrlValue,
  runGovernanceDispositionToUrlValue,
  parseRunGovernanceDispositionDecisionFromSearch,
} from "@/lib/governance/run-governance-disposition-confirm-url";
import {
  runOperatorGovernanceDispositionSuccessMessage,
  type RunOperatorGovernanceDispositionDecision,
} from "@/lib/governance/governance-mutation-outcome-copy";

export type RunDetailRunGovernanceDispositionActionsProps = {
  readonly runId: string;
  readonly hasCommitBlockingFailures: boolean;
  readonly existingDecision?: string | null;
};

type PendingDecision = RunOperatorGovernanceDispositionDecision;

/** TB-112: run-level approve / reject / request-remediation from run detail. */
export function RunDetailRunGovernanceDispositionActions(
  props: RunDetailRunGovernanceDispositionActionsProps,
): ReactElement | null {
  const { runId, hasCommitBlockingFailures, existingDecision = null } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const runDispDecisionParam = searchParams.get("runDispDecision");
  const [pending, setPendingState] = useState<PendingDecision | null>(null);
  const [rationale, setRationale] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const syncRunDispConfirmToUrl = useCallback(
    (decision: PendingDecision | null) => {
      if (pathname.length === 0) {
        return;
      }

      router.replace(
        runGovernanceDispositionConfirmHrefFromSearch(
          searchParams.toString(),
          decision === null ? null : runGovernanceDispositionToUrlValue(decision),
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPending = useCallback(
    (value: SetStateAction<PendingDecision | null>) => {
      setPendingState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncRunDispConfirmToUrl(next);

        return next;
      });
    },
    [syncRunDispConfirmToUrl],
  );

  useEffect(() => {
    const parsed = parseRunGovernanceDispositionDecisionFromSearch(runDispDecisionParam);

    if (parsed === null) {
      setPendingState(null);

      return;
    }

    const decision = runGovernanceDispositionFromUrlValue(parsed);

    if (pending === decision) {
      return;
    }

    setPendingState(decision);
  }, [pending, runDispDecisionParam]);

  if (buyerPolishedShell)
    return null;

  const normalizedExisting = (existingDecision ?? "").trim();

  async function onConfirm(): Promise<void> {
    if (pending === null)
      return;

    const decision = pending;
    const startedAtMs = Date.now();

    setBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await recordRunOperatorGovernanceDisposition(runId, {
        decision,
        rationale: rationale.trim().length > 0 ? rationale.trim() : null,
      });
      await awaitMinimumVisibleDuration(startedAtMs);
      setPending(null);
      setRationale("");
      setSuccessMessage(runOperatorGovernanceDispositionSuccessMessage(decision));
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to record review disposition.";
      setErrorMessage(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3" data-testid="run-governance-disposition-actions">
      {normalizedExisting.length > 0 ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Recorded disposition: <span className="font-medium text-al-text-primary">{normalizedExisting}</span>
        </p>
      ) : null}
      {successMessage !== null ? (
        <OperatorSuccessCallout
          message={successMessage}
          testId="run-governance-disposition-success"
          onDismiss={() => {
            setSuccessMessage(null);
          }}
        />
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
      {errorMessage ? (
        <p
          className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.body)}
          data-testid="run-governance-disposition-error"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null);
          }
        }}
      >
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
