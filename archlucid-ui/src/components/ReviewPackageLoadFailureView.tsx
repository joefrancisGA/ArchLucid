"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import {
  OperatorRouteDiagnosticsPanel,
  type OperatorRouteDiagnosticsPayload,
} from "@/components/operator/OperatorRouteDiagnosticsPanel";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { OperatorEmptyState, OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { getRunDetail } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { errorRecoveryContractForScenario } from "@/lib/error-recovery-contract-copy";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import {
  clearReviewGenerationHandoff,
  readReviewGenerationHandoff,
  type ReviewGenerationHandoffRecord,
} from "@/lib/review-generation-handoff";

const REVIEW_PACKAGES_HREF = "/architecture/reviews";
const START_REVIEW_HREF = "/architecture/reviews/new";
const PENDING_POLL_MS = 3_000;
const PENDING_MAX_MS = 120_000;

export type ReviewPackageNotFoundReason = "missing" | "workspace-mismatch";

export type ReviewPackageLoadFailureViewProps = {
  readonly runId: string;
  readonly fromGeneration: boolean;
  readonly notFoundReason?: ReviewPackageNotFoundReason;
  readonly loadFailure?: ApiLoadFailureState | null;
  readonly attemptedRoute: string;
};

type ViewPhase = "pending" | "failed";

function buildDiagnosticsPayload(input: {
  runId: string;
  attemptedRoute: string;
  fromGeneration: boolean;
  notFoundReason?: ReviewPackageNotFoundReason;
  loadFailure?: ApiLoadFailureState | null;
  handoff: ReviewGenerationHandoffRecord | null;
  lastRetryAtUtc: string | null;
}): OperatorRouteDiagnosticsPayload {
  const scope = readOperatorScopeFromStorage();
  const failureKind =
    input.notFoundReason === "workspace-mismatch"
      ? "workspace-mismatch"
      : input.loadFailure !== null && input.loadFailure !== undefined
        ? "api-load-failure"
        : input.fromGeneration
          ? "post-generation-not-found"
          : "not-found";

  return {
    attemptedRoute: input.attemptedRoute,
    runId: input.runId,
    workspaceId: input.handoff?.workspaceId ?? scope?.workspaceId ?? null,
    workspaceLabel: scope?.workspaceLabel ?? null,
    projectId: input.handoff?.projectId ?? scope?.projectId ?? null,
    jobId: input.handoff?.jobId ?? null,
    httpStatus: input.loadFailure?.httpStatus ?? (input.notFoundReason === "missing" ? 404 : null),
    apiEndpoint: input.loadFailure !== null && input.loadFailure !== undefined ? `/v1/architecture/review/${input.runId}` : null,
    correlationId: input.loadFailure?.correlationId ?? null,
    timestampUtc: input.lastRetryAtUtc ?? new Date().toISOString(),
    failureKind,
    backendMessage: input.loadFailure?.message ?? null,
    handoff: input.handoff,
    loadFailure: input.loadFailure ?? null,
  };
}

/**
 * Post-generation review open failure — polling, retry feedback, and diagnostics. Keeps the normal operator shell
 * (do not wrap in RunDetailMinimalChromeMount).
 */
export function ReviewPackageLoadFailureView(props: ReviewPackageLoadFailureViewProps): React.JSX.Element {
  const { runId, fromGeneration, notFoundReason, loadFailure, attemptedRoute } = props;
  const router = useRouter();
  const [isRetryPending, startRetryTransition] = useTransition();
  const [handoff] = useState<ReviewGenerationHandoffRecord | null>(() => readReviewGenerationHandoff(runId));
  const [phase, setPhase] = useState<ViewPhase>(() =>
    fromGeneration && notFoundReason === "missing" && (loadFailure === null || loadFailure === undefined)
      ? "pending"
      : "failed",
  );
  const [lastRetryAtUtc, setLastRetryAtUtc] = useState<string | null>(null);
  const [lastRetryMessage, setLastRetryMessage] = useState<string | null>(null);
  const [pendingStartedAt] = useState(() => Date.now());

  const tryLoadRun = useCallback(async (): Promise<boolean> => {
    try {
      await getRunDetail(runId);
      clearReviewGenerationHandoff(runId);

      return true;
    } catch {
      return false;
    }
  }, [reviewId]);

  useEffect(() => {
    if (phase !== "pending") {
      return;
    }

    let canceled = false;

    const tick = async () => {
      if (canceled) {
        return;
      }

      if (Date.now() - pendingStartedAt >= PENDING_MAX_MS) {
        setPhase("failed");
        setLastRetryMessage("Review was not available after waiting — open diagnostics or retry.");

        return;
      }

      const loaded = await tryLoadRun();

      if (canceled) {
        return;
      }

      if (loaded) {
        router.refresh();

        return;
      }
    };

    void tick();
    const intervalId = window.setInterval(() => void tick(), PENDING_POLL_MS);

    return () => {
      canceled = true;
      window.clearInterval(intervalId);
    };
  }, [phase, pendingStartedAt, router, tryLoadRun]);

  const diagnostics = useMemo(
    () =>
      buildDiagnosticsPayload({
        runId,
        attemptedRoute,
        fromGeneration,
        notFoundReason,
        loadFailure,
        handoff,
        lastRetryAtUtc,
      }),
    [attemptedRoute, fromGeneration, handoff, lastRetryAtUtc, loadFailure, notFoundReason, runId],
  );

  const handleRetry = () => {
    const now = new Date().toISOString();
    setLastRetryAtUtc(now);
    setLastRetryMessage(null);

    startRetryTransition(() => {
      void (async () => {
        const loaded = await tryLoadRun();

        if (loaded) {
          router.refresh();

          return;
        }

        setLastRetryMessage(`Retry at ${now} did not load the review.`);
        router.refresh();
      })();
    });
  };

  const title = fromGeneration
    ? "We could not open the review that was just generated"
    : "Review could not be opened";

  if (phase === "pending") {
    return (
      <OperatorLoadingNotice>
        <strong className={OPERATOR_TYPOGRAPHY.body}>Opening your generated review…</strong>
        <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
          ArchLucid is waiting for the new review to become available. This usually takes a few seconds after
          generation starts.
        </p>
        <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Review ID: <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">{runId}</code>
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={REVIEW_PACKAGES_HREF} data-testid="pending-open-review-packages">
              Open reviews
            </Link>
          </Button>
        </div>
        <OperatorRouteDiagnosticsPanel payload={diagnostics} />
        <span data-testid="review-package-pending" className="sr-only">
          Waiting for generated review
        </span>
      </OperatorLoadingNotice>
    );
  }

  const bodyParagraph =
    notFoundReason === "workspace-mismatch"
      ? "The review exists but is not visible in the current workspace. Confirm the workspace selector matches where the review was created."
      : fromGeneration
        ? "ArchLucid attempted to open the generated review, but the package could not be loaded. This may be caused by a delayed package commit, workspace mismatch, failed generation job, or API error."
        : "ArchLucid attempted to open this review, but it could not be loaded.";

  const guidance =
    "Retry first. If the problem continues, open diagnostics or copy the error details.";
  const recoveryScenario =
    notFoundReason === "workspace-mismatch" ? "review-package-workspace-mismatch" : "review-package-load";

  return (
    <OperatorEmptyState title={title}>
      <p className={cn("m-0 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{bodyParagraph}</p>
      <OperatorErrorRecoveryContract presentation={errorRecoveryContractForScenario(recoveryScenario)} />
      <p className={cn("m-0 mt-3 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{guidance}</p>
      {lastRetryMessage !== null ? (
        <p className={cn("m-0 mt-3 text-rose-800 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} data-testid="retry-failure-message">
          {lastRetryMessage}
        </p>
      ) : null}
      <div className={cn("mt-4 flex flex-wrap items-center gap-3 font-medium", OPERATOR_TYPOGRAPHY.body)}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isRetryPending || runId.trim().length === 0}
          data-testid="retry-loading-review"
          onClick={handleRetry}
        >
          {isRetryPending ? "Retrying…" : "Retry loading review"}
        </Button>
        <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={REVIEW_PACKAGES_HREF} data-testid="open-review-packages">
          Open reviews
        </Link>
        <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={START_REVIEW_HREF} data-testid="start-new-review">
          {OPERATOR_NAV_LINK_LABELS.capture}
        </Link>
      </div>
      <FatalPageReportProblemSupportRow
        surfaceId="review-detail-hard-load-failure"
        reviewId={runId}
        routePath={attemptedRoute}
        correlationId={loadFailure?.correlationId ?? null}
        httpStatus={loadFailure?.httpStatus ?? null}
        problem={loadFailure?.problem ?? null}
        errorTitle={title}
      />
      <OperatorRouteDiagnosticsPanel payload={diagnostics} />
      <p className={cn("m-0 mt-6 uppercase tracking-wide text-neutral-800 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        ArchLucid Â· REVIEW LOAD FAILURE
      </p>
      <span data-testid="review-package-load-failure" className="sr-only">
        Review could not be opened
      </span>
    </OperatorEmptyState>
  );
}
