"use client";

import Link from "next/link";

import { DemoDataBadge } from "@/components/usability/DemoDataBadge";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

export type SampleReviewDemoBannerProps = {
  readonly runId: string;
};

/** Reminds operators they are viewing curated demo data, not their tenant's review. */
export function SampleReviewDemoBanner(props: SampleReviewDemoBannerProps): React.JSX.Element | null {
  if (props.runId.trim() !== SHOWCASE_STATIC_DEMO_RUN_ID) {
    return null;
  }

  return (
    <div
      className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50/90 px-4 py-2 dark:border-neutral-700 dark:bg-neutral-900/50"
      data-testid="sample-review-demo-banner"
      role="status"
    >
      <DemoDataBadge />
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        You are viewing a curated sample review.{" "}
        <Link href="/architecture/reviews/new" className="text-al-link underline-offset-2 hover:underline">
          Start your own review
        </Link>{" "}
        when you are ready.
      </p>
    </div>
  );
}
