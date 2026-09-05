"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { ReRunReviewOutcomeNotice } from "@/components/runs/ReRunReviewOutcomeNotice";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useReRunReviewInFlightProgress } from "@/hooks/use-re-run-review-in-flight-progress";
import { executeArchitectureRunAsync } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import type { ButtonProps } from "@/components/ui/button";
import { awaitMinimumVisibleDuration } from "@/lib/await-minimum-visible-duration";
import { findInFlightOperationForRun } from "@/lib/operations/find-in-flight-operation-for-run";
import { isInFlightOperationForAttempt } from "@/lib/operations/is-in-flight-operation-for-attempt";
import { isStaleFailedOperationForAttempt } from "@/lib/operations/is-stale-rerun-failure-operation-poll";
import {
  getInFlightOperations,
  subscribeInFlightOperations,
} from "@/lib/operations/in-flight-operations-store";
import { isTerminalOperationState } from "@/lib/operations/operation-state";
import { restartReviewPipelineInFlight } from "@/lib/operations/review-pipeline-in-flight";
import {
  formatReRunReviewTerminalHeadline,
  RE_RUN_REVIEW_MIN_BUSY_MS,
  resolveReRunReviewAttemptNumber,
  reRunReviewOutcomePhaseFromOperationState,
  type ReRunReviewOutcomePhase,
} from "@/lib/re-run-review-outcome-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parseReRunReviewConfirmOpenFromSearch,
  parseReRunReviewConfirmSourceFromSearch,
  reRunReviewConfirmHrefFromSearch,
  resolveReRunReviewConfirmDialogOpenForButton,
} from "@/lib/runs/re-run-review-confirm-url";
import { cn } from "@/lib/utils";

export type ReRunReviewButtonProps = {
  readonly runId: string;
  /** Server-side retry count from run detail — used to label attempt numbers. */
  readonly retryCount?: number | null;
  readonly idleLabel?: string;
  readonly busyLabel?: string;
  readonly variant?: ButtonProps["variant"];
  readonly size?: ButtonProps["size"];
  readonly className?: string;
  readonly "data-testid"?: string;
};

type ReRunReviewOutcomeState = {
  readonly phase: ReRunReviewOutcomePhase;
  readonly attemptNumber: number;
  readonly startedAtMs: number;
  readonly finishedAtMs?: number;
  readonly stepLabel: string;
};

/**
 * Re-invokes agent execution for an existing review (same run id) without routing through Start review intake.
 */
export function ReRunReviewButton(props: ReRunReviewButtonProps): React.JSX.Element {
  const {
    runId,
    retryCount = null,
    idleLabel = "Re-run review",
    busyLabel = "Re-running review…",
    variant = "primary",
    size = "sm",
    className,
    "data-testid": dataTestId = "re-run-review-button",
  } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const reRunConfirmOpenParam = searchParams.get("reRunConfirmOpen");
  const reRunConfirmSourceParam = searchParams.get("reRunConfirmSource");
  const urlConfirmOpen = parseReRunReviewConfirmOpenFromSearch(reRunConfirmOpenParam);
  const urlConfirmSource = parseReRunReviewConfirmSourceFromSearch(reRunConfirmSourceParam);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpenState] = useState(() =>
    resolveReRunReviewConfirmDialogOpenForButton({
      urlConfirmOpen: parseReRunReviewConfirmOpenFromSearch(reRunConfirmOpenParam),
      urlConfirmSource: parseReRunReviewConfirmSourceFromSearch(reRunConfirmSourceParam),
      buttonTestId: dataTestId,
    }),
  );

  const syncConfirmOpenToUrl = useCallback(
    (open: boolean, sourceTestId: string | null = null) => {
      router.replace(
        reRunReviewConfirmHrefFromSearch(searchParams.toString(), open, pathname, sourceTestId),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setConfirmOpen = useCallback(
    (open: boolean) => {
      setConfirmOpenState(open);
      syncConfirmOpenToUrl(open, open ? dataTestId : null);
    },
    [dataTestId, syncConfirmOpenToUrl],
  );

  useEffect(() => {
    setConfirmOpenState(
      resolveReRunReviewConfirmDialogOpenForButton({
        urlConfirmOpen,
        urlConfirmSource,
        buttonTestId: dataTestId,
      }),
    );
  }, [dataTestId, urlConfirmOpen, urlConfirmSource]);
  const [sessionAttemptOffset, setSessionAttemptOffset] = useState(0);
  const [outcome, setOutcome] = useState<ReRunReviewOutcomeState | null>(null);
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const previousServerRetryCountRef = useRef(retryCount);
  const activeAttemptRef = useRef<ReRunReviewOutcomeState | null>(null);

  const operations = useSyncExternalStore(
    subscribeInFlightOperations,
    getInFlightOperations,
    getInFlightOperations,
  );
  const trackedOperation = findInFlightOperationForRun(operations, runId);
  const running = outcome?.phase === "running" && outcome.finishedAtMs === undefined;
  const pendingAttemptNumber = resolveReRunReviewAttemptNumber(retryCount, sessionAttemptOffset);

  const { progressCopy } = useReRunReviewInFlightProgress({
    runId,
    attemptNumber: outcome?.attemptNumber ?? 1,
    active: running,
    startedAtMs: outcome?.startedAtMs ?? Date.now(),
  });

  useEffect(() => {
    const previous = previousServerRetryCountRef.current ?? 0;
    const next = typeof retryCount === "number" && Number.isFinite(retryCount) ? retryCount : 0;

    if (next > previous) {
      setSessionAttemptOffset(0);
    }

    previousServerRetryCountRef.current = retryCount;
  }, [retryCount]);

  useEffect(() => {
    function onShellOperationTerminal(): void {
      const active = activeAttemptRef.current;

      if (active === null) {
        return;
      }

      const latest = findInFlightOperationForRun(getInFlightOperations(), runId);

      if (latest === null || !isTerminalOperationState(latest.state)) {
        return;
      }

      if (!isInFlightOperationForAttempt(latest, active.startedAtMs)) {
        return;
      }

      if (isStaleFailedOperationForAttempt(latest, active.startedAtMs)) {
        return;
      }

      const phase = reRunReviewOutcomePhaseFromOperationState(latest.state);

      if (phase === null || phase === "running") {
        return;
      }

      setOutcome({
        phase,
        attemptNumber: active.attemptNumber,
        startedAtMs: active.startedAtMs,
        finishedAtMs: Date.now(),
        stepLabel: latest.stepLabel,
      });
    }

    window.addEventListener("archlucid:shell-operation-terminal", onShellOperationTerminal);

    return () => {
      window.removeEventListener("archlucid:shell-operation-terminal", onShellOperationTerminal);
    };
  }, [runId]);

  useEffect(() => {
    const active = activeAttemptRef.current;

    if (active === null || trackedOperation === null) {
      return;
    }

    if (!isInFlightOperationForAttempt(trackedOperation, active.startedAtMs)) {
      return;
    }

    if (isStaleFailedOperationForAttempt(trackedOperation, active.startedAtMs)) {
      return;
    }

    const phase = reRunReviewOutcomePhaseFromOperationState(trackedOperation.state);

    if (phase === null) {
      return;
    }

    if (phase === "running") {
      setOutcome({
        phase,
        attemptNumber: active.attemptNumber,
        startedAtMs: active.startedAtMs,
        stepLabel: trackedOperation.stepLabel,
      });

      return;
    }

    setOutcome({
      phase,
      attemptNumber: active.attemptNumber,
      startedAtMs: active.startedAtMs,
      finishedAtMs: Date.now(),
      stepLabel: trackedOperation.stepLabel,
    });
  }, [trackedOperation?.state, trackedOperation?.stepLabel]);

  async function onReRunReview(): Promise<void> {
    const clickStartedAtMs = Date.now();
    const attemptNumber = resolveReRunReviewAttemptNumber(retryCount, sessionAttemptOffset);

    restartReviewPipelineInFlight(runId, clickStartedAtMs);
    setSessionAttemptOffset((previous) => previous + 1);
    setBusy(true);
    setError(null);
    setConfirmOpen(false);

    const nextOutcome: ReRunReviewOutcomeState = {
      phase: "running",
      attemptNumber,
      startedAtMs: clickStartedAtMs,
      stepLabel: "Queued",
    };

    activeAttemptRef.current = nextOutcome;
    setOutcome(nextOutcome);

    try {
      await executeArchitectureRunAsync(runId);
      await awaitMinimumVisibleDuration(clickStartedAtMs, RE_RUN_REVIEW_MIN_BUSY_MS);

      const latest = findInFlightOperationForRun(getInFlightOperations(), runId);

      setOutcome({
        ...nextOutcome,
        stepLabel: latest?.stepLabel ?? "Queued",
      });
      router.refresh();
    } catch (e: unknown) {
      activeAttemptRef.current = null;
      setOutcome(null);

      if (isApiRequestError(e)) {
        setError({
          message: e.message,
          problem: e.problem,
          correlationId: e.correlationId,
        });
      } else {
        setError({
          message: e instanceof Error ? e.message : "Re-run failed.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  const outcomeHeadline =
    outcome === null
      ? null
      : outcome.phase === "running" && outcome.finishedAtMs === undefined
        ? (progressCopy?.headline ?? `Re-run started — attempt ${outcome.attemptNumber} · ${outcome.stepLabel}`)
        : formatReRunReviewTerminalHeadline({
            attemptNumber: outcome.attemptNumber,
            startedAtMs: outcome.startedAtMs,
            finishedAtMs: outcome.finishedAtMs ?? Date.now(),
            terminalState:
              outcome.phase === "succeeded"
                ? "Succeeded"
                : outcome.phase === "failed"
                  ? "Failed"
                  : "Canceled",
            stepLabel: outcome.stepLabel,
          });

  return (
    <div className={cn("flex min-w-0 w-full max-w-full flex-col items-start gap-2", className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={busy || running}
        aria-busy={busy || running}
        onClick={() => {
          setConfirmOpen(true);
        }}
        data-testid={dataTestId}
      >
        {busy ? busyLabel : idleLabel}
      </Button>
      {confirmOpen ? (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent data-testid="re-run-review-confirm-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Re-run this review?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body)}>
                  <p className="m-0">
                    Attempt <strong>{pendingAttemptNumber}</strong> will re-invoke architecture analysis on this review.
                    Metered AI budget will be consumed.
                  </p>
                  <AiBudgetSpendNotice action="Architecture review analysis" testId="re-run-review-budget-notice" />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={busy || running}
                onClick={() => {
                  void onReRunReview();
                }}
                data-testid="re-run-review-confirm-button"
              >
                Re-run review (attempt {pendingAttemptNumber})
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
      {outcome !== null && outcomeHeadline !== null ? (
        <ReRunReviewOutcomeNotice
          phase={outcome.phase}
          headline={outcomeHeadline}
          runningProgress={running ? progressCopy : null}
        />
      ) : null}
      {error !== null ? (
        <div className="mt-2">
          <OperatorApiProblem
            problem={error.problem}
            fallbackMessage={error.message}
            correlationId={error.correlationId}
            variant="warning"
          />
        </div>
      ) : null}
    </div>
  );
}
