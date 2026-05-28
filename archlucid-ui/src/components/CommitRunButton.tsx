"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { commitArchitectureRun, getRunSummary } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import {
  recordFirstFinalizationAttemptedOnce,
  recordFirstTenantFunnelEvent,
} from "@/lib/first-tenant-funnel-telemetry";

/** Nav and review-detail copy — replay/compare stay available post-finalize (see UI_GLOSSARY_V1). */
export const FINALIZE_REPLAY_COMPARE_TOOLTIP = "Replay and comparison remain available after finalizing.";

export type CommitRunButtonProps = {
  runId: string;
  /** When true, the review already has a reviewed manifest — commit is not offered. */
  disabled: boolean;
  /** Existing server-side finding coverage says finalize will be blocked. */
  commitBlockedReason?: string | null;
};

/**
 * Commits the architecture run via POST /v1/architecture/run/{runId}/commit (ExecuteAuthority).
 */
export function CommitRunButton({ runId, disabled, commitBlockedReason = null }: CommitRunButtonProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [findingsCount, setFindingsCount] = useState<number | null>(null);
  const [notifySponsor, setNotifySponsor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);

  async function onConfirm(): Promise<void> {
    setBusy(true);
    setError(null);

    recordFirstFinalizationAttemptedOnce();

    try {
      await commitArchitectureRun(runId, { notifySponsor });
      recordFirstTenantFunnelEvent("first_run_committed");
      setDialogOpen(false);
      
      try {
        const summary = await getRunSummary(runId);
        setFindingsCount(summary.findingCount ?? null);
      } catch {
        // Ignore error fetching summary
      }
      
      setSuccessModalOpen(true);
    } catch (e: unknown) {
      if (isApiRequestError(e)) {
        setError({
          message: e.message,
          problem: e.problem,
          correlationId: e.correlationId,
        });
      } else {
        setError({
          message: e instanceof Error ? e.message : "Finalization failed.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  if (disabled) {
    return (
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
        This review is already finalized (reviewed architecture snapshot present).
      </p>
    );
  }

  if (commitBlockedReason !== null && commitBlockedReason.trim().length > 0) {
    return (
      <div
        className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-950 dark:border-red-800 dark:bg-red-950/40 dark:text-red-50"
        data-testid="commit-blocked-finding-coverage"
        role="alert"
      >
        <p className="m-0 font-semibold">Finalize is blocked by finding coverage</p>
        <p className="m-0 mt-2 leading-relaxed">{commitBlockedReason.trim()}</p>
        <p className="m-0 mt-2 text-xs leading-relaxed">
          Resolve the blocking engine failure or regenerate coverage before finalizing this architecture review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Button
          type="button"
          variant="primary"
          title={FINALIZE_REPLAY_COMPARE_TOOLTIP}
          onClick={() => {
            setError(null);
            setNotifySponsor(false);
            setDialogOpen(true);
          }}
        >
          Finalize review
        </Button>
        <p className="mt-1.5 max-w-xl text-sm text-neutral-600 dark:text-neutral-400">
          Finalizes the reviewed architecture snapshot and decision traces when the pipeline snapshots are ready. Requires
          permission to finalize.
        </p>
      </div>

      {error !== null ? (
        <>
          {error.problem?.blockExplanation !== undefined &&
          error.problem.blockExplanation.trim().length > 0 ? (
            <div
              className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-50"
              data-testid="commit-governance-block-explanation"
            >
              <p className="m-0 font-semibold">Why governance blocked finalization</p>
              <p className="m-0 mt-2 leading-relaxed">{error.problem.blockExplanation}</p>
            </div>
          ) : null}
          <OperatorApiProblem
            problem={error.problem}
            fallbackMessage={error.message}
            correlationId={error.correlationId}
          />
        </>
      ) : null}

      <ConfirmationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Finalize this review?"
        description={`Merges agent results for this review through the decision engine and saves the architecture snapshot. If the review package is not ready, the API returns a conflict — adjust inputs and try again. ${FINALIZE_REPLAY_COMPARE_TOOLTIP}`}
        confirmLabel="Finalize review"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={() => void onConfirm()}
        busy={busy}
        extraContent={
          <div className="flex items-start gap-2 px-1 py-1">
            <input
              id="commit-notify-sponsor"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border border-neutral-300 text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-100 dark:focus-visible:ring-neutral-500"
              checked={notifySponsor}
              disabled={busy}
              onChange={(e) => {
                setNotifySponsor(e.target.checked);
              }}
            />
            <div className="min-w-0">
              <Label htmlFor="commit-notify-sponsor" className="font-medium text-neutral-900 dark:text-neutral-100">
                Email tenant admin contact
              </Label>
              <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                Sends a short heads-up with a link to this review when the tenant admin mailbox is on file and outbound
                email is configured.
              </p>
            </div>
          </div>
        }
      />

      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Finalized</DialogTitle>
            <DialogDescription>
              The architecture snapshot has been saved successfully.
              {findingsCount !== null && (
                <span className="block mt-2 font-medium text-neutral-900 dark:text-neutral-100">
                  Total findings: {findingsCount}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Continue your analysis with advanced tools:
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild className="justify-start">
                <Link href={`/reviews/${encodeURIComponent(runId)}#artifacts-export`}>
                  Artifacts Export
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href={`/reviews/${encodeURIComponent(runId)}/compare`}>
                  Compare
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href={`/reviews/${encodeURIComponent(runId)}/graph`}>
                  Knowledge Graph
                </Link>
              </Button>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSuccessModalOpen(false);
                router.push("/governance/findings");
              }}
            >
              Go to Findings
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={() => {
                setSuccessModalOpen(false);
                router.refresh();
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
