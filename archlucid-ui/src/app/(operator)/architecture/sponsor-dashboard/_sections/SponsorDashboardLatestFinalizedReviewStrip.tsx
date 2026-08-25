"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type SponsorDashboardLatestFinalizedReviewStripProps = {
  readonly runId: string;
  readonly reviewTitle?: string | null;
};

/** Routes sponsors to the most recent finalized review before reading portfolio KPIs. */
export function SponsorDashboardLatestFinalizedReviewStrip(
  props: SponsorDashboardLatestFinalizedReviewStripProps,
): React.JSX.Element {
  const title = props.reviewTitle?.trim() ?? "Latest finalized review";

  return (
    <section
      aria-labelledby="sponsor-dashboard-latest-finalized-review-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="sponsor-dashboard-latest-finalized-review-strip"
    >
      <h2
        id="sponsor-dashboard-latest-finalized-review-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Open your most recent finalized review
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Portfolio savings and findings roll up from sealed review packages. Start with{" "}
        <span className="font-medium text-al-text-primary">{title}</span>.
      </p>
      <div className="mt-3">
        <Button type="button" variant="primary" size="sm" asChild data-testid="sponsor-dashboard-latest-finalized-review-open">
          <Link href={reviewDetailPath(props.runId)}>Open review package</Link>
        </Button>
      </div>
    </section>
  );
}
