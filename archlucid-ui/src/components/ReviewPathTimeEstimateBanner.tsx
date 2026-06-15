"use client";

import type { ReviewCreationPathId } from "@/lib/review-path-time-estimates";
import { formatReviewPathTimeEstimate } from "@/lib/review-path-time-estimates";

export type ReviewPathTimeEstimateBannerProps = {
  readonly pathId: ReviewCreationPathId;
};

/** Shows estimated time and outcome for the selected review creation path. */
export function ReviewPathTimeEstimateBanner(props: ReviewPathTimeEstimateBannerProps): React.JSX.Element {
  const text = formatReviewPathTimeEstimate(props.pathId);

  return (
    <p
      className="m-0 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
      data-testid="review-path-time-estimate"
      role="status"
    >
      {text}
    </p>
  );
}
