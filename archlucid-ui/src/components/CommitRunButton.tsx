"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { LongOperationWaitNotice } from "@/components/LongOperationWaitNotice";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { PreCommitGovernanceBlockPanel } from "@/components/PreCommitGovernanceBlockPanel";
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
import { syncArchitectureDraftRegistryForFinalizedReview } from "@/lib/architecture/architecture-draft-registry-finalize-sync";
import { readAcknowledgedAssumptionIds } from "@/lib/review-quality/review-assumption-ack-store";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import {
  recordFirstFinalizationAttemptedOnce,
  recordFirstTenantFunnelEvent,
} from "@/lib/first-tenant-funnel-telemetry";
import { invalidateOperatorHomeRunsCaches } from "@/lib/operator/operator-query-invalidation";
import { resolvePreCommitGovernanceBlockView } from "@/lib/pre-commit-governance-block-problem";
import { invalidateTenantTrialStatusCache } from "@/lib/tenant-trial-status-client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  FINALIZE_REPLAY_COMPARE_NOTE,
} from "@/lib/finalize-consequence-preview";
import { PRIOR_MANIFEST_RETRIEVAL_HELP_FINALIZE_SUCCESS_LINK_LABEL } from "@/lib/prior-manifest-retrieval-help-inbound-label-surfaces";
import { FinalizeConsequencePreview } from "@/components/FinalizeConsequencePreview";

/** Nav and review-detail copy  —  replay/compare stay available post-finalize (see UI_GLOSSARY_V1). */
export const FINALIZE_REPLAY_COMPARE_TOOLTIP = FINALIZE_REPLAY_COMPARE_NOTE;

export type CommitRunButtonProps = {
  runId: string;
  /** When true, the review already has a reviewed manifest  —  commit is not offered. */
  disabled: boolean;
  /** Existing server-side finding coverage says finalize will be blocked. */
  commitBlockedReason?: string | null;
  /** Demote to outline when another surface owns the page's single primary CTA (TB-618). */
  buttonVariant?: "primary" | "outline";
};

/**
 * Finalizes the architecture review via POST /v1/architecture/review/{runId}/finalize (ExecuteAuthority).
 */
export function CommitRunButton({
  runId,
  disabled,
  commitBlockedReason = null,
  buttonVariant = "primary",
}: CommitRunButtonProps) {
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
      await commitArchitectureRun(runId, {
        notifySponsor,
        acknowledgedAssumptionIds: [...readAcknowledgedAssumptionIds(runId)],
      });
      recordFirstTenantFunnelEvent("first_run_committed");
      syncArchitectureDraftRegistryForFinalizedReview(runId);
      await Promise.all([invalidateOperatorHomeRunsCaches(), invalidateTenantTrialStatusCache()]);
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

  const preCommitGovernanceBlock =
    error === null ? null : resolvePreCommitGovernanceBlockView(error.problem);

  if (disabled) {
    return (
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        This review is already finalized (reviewed architecture snapshot present).
      </p>
    );
  }

  if (commitBlockedReason !== null && commitBlockedReason.trim().length > 0) {
    return (
      <div
        className={cn(
          "rounded-md border border-rose-600/40 bg-al-surface-raised p-4 text-al-text-primary dark:border-rose-700/50",
          OPERATOR_TYPOGRAPHY.body,
        )}
        data-testid="commit-blocked-finding-coverage"
        role="alert"
      >
        <p className="m-0 font-semibold">Finalize is blocked by finding coverage</p>
        <p className="m-0 mt-2 leading-relaxed">{commitBlockedReason.trim()}</p>
        <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.helper)}>
          Resolve the blocking engine failure or regenerate coverage before finalizing this architecture review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <LongOperationWaitNotice
        active={busy}
        operationLabel="Finalizing architecture review"
        stageLabel="Saving finalized review record"
        testId="commit-run-long-wait"
      />
      <div>
        <Button
          type="button"
          variant={buttonVariant}
          title={FINALIZE_REPLAY_COMPARE_TOOLTIP}
          data-testid="commit-run-finalize"
          onClick={() => {
            setError(null);
            setNotifySponsor(false);
            setDialogOpen(true);
          }}
        >
          Finalize review
        </Button>
        <p className={cn("mt-1.5 max-w-xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Finalizes the reviewed architecture snapshot and decision traces when the pipeline snapshots are ready. Requires
          permission to finalize.
        </p>
      </div>

      {error !== null ? (
        <>
          {preCommitGovernanceBlock !== null ? (
            <PreCommitGovernanceBlockPanel runId={runId} block={preCommitGovernanceBlock} />
          ) : error.problem?.blockExplanation !== undefined &&
            error.problem.blockExplanation.trim().length > 0 ? (
            <div
              className={cn(
                "rounded-md border border-amber-600/40 bg-al-surface-raised p-4 text-al-text-primary dark:border-amber-700/50",
                OPERATOR_TYPOGRAPHY.body,
              )}
              data-testid="commit-governance-block-explanation"
            >
              <p className="m-0 font-semibold">AI-assisted: why policy blocked finalization</p>
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
        description={`Creates the finalized review record for this architecture review. If the review is not ready, resolve blockers and try again. ${FINALIZE_REPLAY_COMPARE_TOOLTIP}`}
        confirmLabel="Finalize review"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={() => void onConfirm()}
        busy={busy}
        extraContent={
          <div className="space-y-3 px-1 py-1">
            <FinalizeConsequencePreview />
            <div className="flex items-start gap-2">
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
                <Label htmlFor="commit-notify-sponsor" className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                  Email tenant admin contact
                </Label>
                <p className={cn("mt-0.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  Sends a short heads-up with a link to this review when the tenant admin mailbox is on file and outbound
                  email is configured.
                </p>
              </div>
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
              <span className={cn("mt-2 block", OPERATOR_TYPOGRAPHY.helper)}>
                This review&apos;s decisions are now searchable in Ask.{" "}
                <Link
                  href="/help/prior-manifest-retrieval"
                  className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700 dark:text-neutral-100 dark:hover:text-neutral-300"
                >
                  {PRIOR_MANIFEST_RETRIEVAL_HELP_FINALIZE_SUCCESS_LINK_LABEL}
                </Link>
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              Continue your analysis with advanced tools:
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild className="justify-start">
                <Link href="#sponsor-handoff">Send to sponsor</Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href={`/architecture/reviews/${encodeURIComponent(runId)}/compare`}>
                  Compare
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href={`/architecture/reviews/${encodeURIComponent(runId)}/graph`}>
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
