import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";
import { StepProgressMeter } from "@/components/ui/step-progress-meter";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FirstReviewGuideProgress } from "@/lib/first-review-guide-state";
import { formatStepProgressCompleteLabel } from "@/lib/step-progress-label";

type FirstReviewGuideProgressSummaryProps = {
  readonly progress: FirstReviewGuideProgress;
  readonly isPending: boolean;
  readonly isError: boolean;
};

export function FirstReviewGuideProgressSummary({
  progress,
  isPending,
  isError,
}: FirstReviewGuideProgressSummaryProps) {
  if (isPending) {
    return (
      <div className="space-y-2" data-testid="first-review-guide-progress-loading" aria-busy="true">
        <Skeleton className="h-4 w-48" aria-hidden />
        <Skeleton className="h-1.5 w-full" aria-hidden />
      </div>
    );
  }

  if (isError) {
    return (
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="first-review-guide-progress-unavailable">
        Progress unavailable until review status loads.
      </p>
    );
  }

  return (
    <div className="space-y-2" data-testid="first-review-guide-progress-summary">
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-medium text-neutral-900 dark:text-neutral-100">{progress.summaryLabel}</span>
        {progress.detailLabel !== null ? (
          <span className="block text-neutral-600 dark:text-neutral-400">{progress.detailLabel}</span>
        ) : null}
      </p>
      <StepProgressMeter
        completedCount={progress.completedStepCount}
        totalCount={progress.totalStepCount}
        label="First review progress"
        valueText={formatStepProgressCompleteLabel(progress.completedStepCount, progress.totalStepCount)}
        className="max-w-none"
      />
    </div>
  );
}
