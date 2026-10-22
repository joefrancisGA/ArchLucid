import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildPolicyPacksHrefWithReviewId } from "@/lib/policy-packs-review-handoff";
import { cn } from "@/lib/utils";

export type PolicyPackAssignFromReviewStripProps = {
  readonly reviewId: string;
  readonly reviewTitle?: string | null;
};

/** Routes operators from a review with policy gaps to policy pack assignment. */
export function PolicyPackAssignFromReviewStrip(props: PolicyPackAssignFromReviewStripProps): React.JSX.Element {
  const titleTrimmed = props.reviewTitle?.trim() ?? "";
  const reviewLabel = titleTrimmed.length > 0 ? titleTrimmed : props.reviewId;

  return (
    <section
      aria-labelledby="policy-pack-assign-from-review-heading"
      className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800"
      data-testid="policy-pack-assign-from-review-strip"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2
            id="policy-pack-assign-from-review-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Close policy gaps for this review
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Assign or enable policy packs for <span className="font-medium text-al-text-primary">{reviewLabel}</span>{" "}
            before the next commit gate.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" asChild data-testid="policy-pack-assign-from-review-action">
          <Link href={buildPolicyPacksHrefWithReviewId(props.reviewId)}>Assign policy packs</Link>
        </Button>
      </div>
    </section>
  );
}
