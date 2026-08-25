"use client";

import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { ReviewStartUnresolvedNotice } from "@/components/review-intake/ReviewStartUnresolvedNotice";
import type { ReviewCreationProgress } from "@/hooks/use-review-creation-progress";
import { useReviewCreationAutoRecheck } from "@/hooks/use-review-creation-auto-recheck";
import type { ReviewStartInFlightProgress } from "@/hooks/use-review-start-in-flight-progress";
import { REVIEW_START_PREPARING_LABEL } from "@/lib/review-start-progress-copy";

/** The slice of `useReviewCreationProgress` these notices read. */
export type WizardCreationProgressState = Pick<
  ReviewCreationProgress,
  "showStagedPanel" | "activeStageId" | "stages" | "waitCopy" | "outcome" | "isActive" | "isRechecking"
>;

export type WizardCreationProgressNoticesProps = {
  readonly progress: WizardCreationProgressState;
  readonly inFlightProgress?: ReviewStartInFlightProgress | null;
  /** Test-id stem, e.g. `quick-start`. */
  readonly testIdPrefix: string;
  /** Replays the wizard-session idempotent create — does not call submitRun again. */
  readonly onRecheck: () => void;
};

/**
 * Staged create-run progress plus the unresolved-not-failed recovery notice. `unresolved` means the
 * browser stopped waiting, not that the server failed, so it stays a recheck rather than an error.
 */
export function WizardCreationProgressNotices(
  props: WizardCreationProgressNoticesProps,
): React.ReactElement {
  const { progress, inFlightProgress, testIdPrefix, onRecheck } = props;
  const { autoRecheckExhausted } = useReviewCreationAutoRecheck({
    outcome: progress.outcome,
    isActive: progress.isActive,
    onRecheck,
  });
  const serverStepLabel = inFlightProgress?.serverStepLabel ?? null;
  const showServerProgress =
    serverStepLabel !== null && serverStepLabel.length > 0 && progress.activeStageId === null;

  return (
    <>
      {showServerProgress ? (
        <div
          className="mt-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-700"
          role="status"
          aria-live="polite"
          data-testid={`${testIdPrefix}-review-start-server-progress`}
        >
          <p className="m-0 font-medium text-al-text-primary">{serverStepLabel}</p>
          {inFlightProgress?.waitCopy?.detail ? (
            <p className="m-0 mt-1 text-al-text-secondary">{inFlightProgress.waitCopy.detail}</p>
          ) : null}
        </div>
      ) : null}

      {progress.showStagedPanel && progress.activeStageId !== null ? (
        <div className="mt-3">
          <ReviewStartStagedProgress
            stages={progress.stages}
            activeStageId={progress.activeStageId}
            headline={REVIEW_START_PREPARING_LABEL}
            detail={progress.waitCopy?.detail ?? null}
            testId={`${testIdPrefix}-review-start-progress`}
          />
        </div>
      ) : null}

      {progress.outcome?.kind === "unresolved" ? (
        <div className="mt-3">
          <ReviewStartUnresolvedNotice
            onRecheck={onRecheck}
            onStartAgain={onRecheck}
            autoRecheckExhausted={autoRecheckExhausted}
            isRechecking={progress.isRechecking}
            testId={`${testIdPrefix}-unresolved-notice`}
          />
        </div>
      ) : null}
    </>
  );
}
