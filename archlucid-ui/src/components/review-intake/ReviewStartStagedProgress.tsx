"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReviewStartStageDefinition, ReviewStartStageId } from "@/lib/review-start-progress-stages";
import { reviewStartStageIndex } from "@/lib/review-start-progress-stages";

export type ReviewStartStagedProgressProps = {
  readonly stages: readonly ReviewStartStageDefinition[];
  readonly activeStageId: ReviewStartStageId;
  readonly headline: string;
  /** Escalating elapsed-time framing (10s / 30s / 60s). Never a percentage. */
  readonly detail?: string | null;
  readonly className?: string;
  readonly testId?: string;
};

/** Honest named stages for review start — no simulated percentages. */
export function ReviewStartStagedProgress(props: ReviewStartStagedProgressProps): React.ReactElement {
  const activeIndex = reviewStartStageIndex(props.stages, props.activeStageId);

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-700",
        props.className,
      )}
      data-testid={props.testId ?? "review-start-staged-progress"}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{props.headline}</p>
      {props.detail !== null && props.detail !== undefined && props.detail.length > 0 ? (
        <p
          className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="review-start-staged-progress-detail"
        >
          {props.detail}
        </p>
      ) : null}
      <ol className="m-0 mt-3 list-none space-y-1 p-0">
        {props.stages.map((stage, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;

          return (
            <li
              key={stage.id}
              className={cn(
                OPERATOR_TYPOGRAPHY.helper,
                isActive
                  ? "font-medium text-al-text-primary"
                  : isComplete
                    ? "text-al-text-secondary"
                    : "text-al-text-secondary/70",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {isComplete ? "✓ " : isActive ? "→ " : "· "}
              {stage.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
