"use client";

import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { ReviewStartUnresolvedNotice } from "@/components/review-intake/ReviewStartUnresolvedNotice";
import type { ReviewCreationProgress } from "@/hooks/use-review-creation-progress";
import { REVIEW_START_PREPARING_LABEL } from "@/lib/review-start-progress-copy";

/** The slice of `useReviewCreationProgress` these notices read. */
export type WizardCreationProgressState = Pick<
  ReviewCreationProgress,
  "showStagedPanel" | "activeStageId" | "stages" | "waitCopy" | "outcome" | "isActive"
>;

export type WizardCreationProgressNoticesProps = {
  readonly progress: WizardCreationProgressState;
  /** Test-id stem, e.g. `quick-start`. */
  readonly testIdPrefix: string;
  /** Replays the same idempotency key, so a recheck resolves to one review either way. */
  readonly onRecheck: () => void;
};

/**
 * Staged create-run progress plus the unresolved-not-failed recovery notice. `unresolved` means the
 * browser stopped waiting, not that the server failed, so it stays a recheck rather than an error.
 */
export function WizardCreationProgressNotices(
  props: WizardCreationProgressNoticesProps,
): React.ReactElement {
  const { progress, testIdPrefix, onRecheck } = props;

  return (
    <>
      {progress.showStagedPanel && progress.activeStageId !== null ? (
        <div className="mb-3">
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
        <div className="mb-3">
          <ReviewStartUnresolvedNotice
            onRecheck={onRecheck}
            isRechecking={progress.isActive}
            testId={`${testIdPrefix}-unresolved-notice`}
          />
        </div>
      ) : null}
    </>
  );
}
