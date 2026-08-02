import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FirstReviewGuideProgress } from "@/lib/first-review-guide-state";

type FirstReviewGuideProgressSummaryProps = {
  readonly progress: FirstReviewGuideProgress;
};

export function FirstReviewGuideProgressSummary({ progress }: FirstReviewGuideProgressSummaryProps) {
  const progressPercent = Math.round(progress.progressFraction * 100);

  return (
    <div className="space-y-2" data-testid="first-review-guide-progress-summary" aria-live="polite">
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-medium text-neutral-900 dark:text-neutral-100">{progress.summaryLabel}</span>
        {progress.currentStepLabel !== null ? (
          <span className="block text-neutral-600 dark:text-neutral-400">{progress.currentStepLabel}</span>
        ) : null}
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        aria-label="First review progress"
        className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
      >
        <div
          className="h-full rounded-full bg-teal-700 transition-[width] duration-300 dark:bg-teal-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
