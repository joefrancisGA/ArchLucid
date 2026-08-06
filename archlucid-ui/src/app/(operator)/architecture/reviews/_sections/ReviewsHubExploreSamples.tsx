"use client";

import Link from "next/link";

import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import { Button } from "@/components/ui/button";
import { isCompareRouteBlockedUnderDemoStrictShell } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { showcaseSampleReviewPackageHref } from "@/lib/showcase-sample-review-registry";
import { cn } from "@/lib/utils";

import {
  REVIEWS_HUB_COMPARE_HINT,
  REVIEWS_HUB_COMPARE_LABEL,
  REVIEWS_HUB_EXPLORE_SAMPLES_TITLE,
  REVIEWS_HUB_LOAD_SAMPLE_HINT,
  REVIEWS_HUB_PRIMARY_LOAD_SAMPLE_LABEL,
  REVIEWS_HUB_PRIMARY_VIEW_SAMPLE_LABEL,
  REVIEWS_HUB_VIEW_SAMPLE_HINT,
} from "./reviews-hub-copy";

function ExploreSampleAction(props: {
  readonly testId: string;
  readonly children: React.ReactNode;
  readonly hint: string;
}): React.JSX.Element {
  return (
    <article className="flex min-w-[12rem] flex-1 flex-col gap-2" data-testid={props.testId}>
      <div>{props.children}</div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.hint}</p>
    </article>
  );
}

/** Secondary sample and comparison actions for the `/architecture/reviews` hub. */
export function ReviewsHubExploreSamples(): React.JSX.Element {
  const compareBlocked = isCompareRouteBlockedUnderDemoStrictShell();

  return (
    <section className="mt-2" data-testid="reviews-hub-explore-samples" aria-labelledby="reviews-hub-explore-samples-heading">
      <h2 id="reviews-hub-explore-samples-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {REVIEWS_HUB_EXPLORE_SAMPLES_TITLE}
      </h2>
      <div className="mt-3 flex flex-wrap gap-4">
        <ExploreSampleAction testId="reviews-hub-load-sample-action" hint={REVIEWS_HUB_LOAD_SAMPLE_HINT}>
          <SeedSampleReviewButton variant="outline" size="sm" label={REVIEWS_HUB_PRIMARY_LOAD_SAMPLE_LABEL} />
        </ExploreSampleAction>
        <ExploreSampleAction testId="reviews-hub-view-sample-action" hint={REVIEWS_HUB_VIEW_SAMPLE_HINT}>
          <Button variant="outline" size="sm" asChild>
            <Link href={showcaseSampleReviewPackageHref()} className="no-underline" data-testid="reviews-hub-view-sample-package">
              {REVIEWS_HUB_PRIMARY_VIEW_SAMPLE_LABEL}
            </Link>
          </Button>
        </ExploreSampleAction>
        {!compareBlocked ? (
          <ExploreSampleAction testId="reviews-hub-compare-action" hint={REVIEWS_HUB_COMPARE_HINT}>
            <Button variant="outline" size="sm" asChild>
              <Link href="/insights/compare-two-reviews" className="no-underline" data-testid="reviews-hub-compare-reviews">
                {REVIEWS_HUB_COMPARE_LABEL}
              </Link>
            </Button>
          </ExploreSampleAction>
        ) : null}
      </div>
    </section>
  );
}
