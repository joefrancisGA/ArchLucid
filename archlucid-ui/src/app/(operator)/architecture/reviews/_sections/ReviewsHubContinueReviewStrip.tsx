import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReviewsHubContinueReviewCandidate } from "@/lib/reviews-hub-continue-review";
import { cn } from "@/lib/utils";

export type ReviewsHubContinueReviewStripProps = {
  readonly candidate: ReviewsHubContinueReviewCandidate;
};

/** Pinned continue row for the highest-priority in-flight review on the reviews hub. */
export function ReviewsHubContinueReviewStrip(props: ReviewsHubContinueReviewStripProps): React.JSX.Element {
  const { candidate } = props;
  const helper =
    candidate.kind === "awaiting-disposition"
      ? "Findings are ready — finish disposition or finalize the package."
      : candidate.isStalled
        ? `In progress for ${candidate.elapsedMinutes} minutes — pick up where you left off.`
        : "Continue the review you started most recently.";

  return (
    <section
      aria-labelledby="reviews-hub-continue-review-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="reviews-hub-continue-review-strip"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2
            id="reviews-hub-continue-review-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue this review
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{helper}</p>
          <p className={cn("m-0 mt-2 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{candidate.title}</p>
        </div>
        <Button type="button" variant="primary" size="sm" asChild data-testid="reviews-hub-continue-review-action">
          <Link href={candidate.href}>Continue review</Link>
        </Button>
      </div>
    </section>
  );
}
