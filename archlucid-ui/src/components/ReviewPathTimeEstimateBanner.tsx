"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReviewCreationPathId } from "@/lib/review-path-time-estimates";
import { formatReviewPathTimeEstimate } from "@/lib/review-path-time-estimates";

export type ReviewPathTimeEstimateBannerProps = {
  readonly pathId: ReviewCreationPathId;
  /** Bordered callout vs quiet helper line in a form footer. */
  readonly presentation?: "banner" | "inline";
};

/** Shows estimated time and outcome for the selected review creation path. */
export function ReviewPathTimeEstimateBanner(props: ReviewPathTimeEstimateBannerProps): React.JSX.Element {
  const presentation = props.presentation ?? "banner";
  const text = formatReviewPathTimeEstimate(props.pathId);

  if (presentation === "inline") {
    return (
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="review-path-time-estimate"
        role="status"
      >
        {text}
      </p>
    );
  }

  return (
    <p
      className={cn(
        "m-0 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="review-path-time-estimate"
      role="status"
    >
      {text}
    </p>
  );
}
