"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { RunDemoReviewButton } from "@/components/RunDemoReviewButton";
import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import { Button } from "@/components/ui/button";
import {
  BUYER_SEED_SAMPLE_WORKSPACE_CTA,
  BUYER_START_ARCHITECTURE_REVIEW_CTA,
  RUNS_LIST_EMPTY_PRIMARY_PATH_DESCRIPTION,
  RUNS_LIST_EMPTY_PRIMARY_PATH_TITLE,
  RUNS_LIST_EMPTY_SAMPLE_PATH_DESCRIPTION,
  RUNS_LIST_EMPTY_SAMPLE_PATH_TITLE,
  RUNS_LIST_VIEW_SAMPLE_PACKAGE_CTA,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";

const pathCardClass = cn(OPERATOR_SURFACE_CARD_CLASS, "flex h-full flex-col gap-3 p-4");

const samplePackageHref = showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId);

/** Reviews index empty state — balanced primary and sample paths for first-hour operators. */
export function RunsListEmptyState() {
  return (
    <div
      role="status"
      aria-label="No review packages yet"
      data-testid="runs-list-empty-state"
      className={cn("mt-6 grid max-w-4xl gap-4 md:grid-cols-2", OPERATOR_LAYOUT.sectionStack)}
    >
      <section data-testid="runs-list-empty-primary-path" className={pathCardClass}>
        <div className="space-y-1">
          <h3 className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-al-text-primary")}>
            {RUNS_LIST_EMPTY_PRIMARY_PATH_TITLE}
          </h3>
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-600 dark:text-neutral-400")}>
            {RUNS_LIST_EMPTY_PRIMARY_PATH_DESCRIPTION}
          </p>
        </div>
        <Button asChild variant="primary" size="sm" className="w-fit">
          <Link href="/reviews/new" data-testid="runs-list-empty-start-review">
            {BUYER_START_ARCHITECTURE_REVIEW_CTA}
          </Link>
        </Button>
      </section>

      <section data-testid="runs-list-empty-sample-path" className={pathCardClass}>
        <div className="space-y-1">
          <h3 className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-al-text-primary")}>
            {RUNS_LIST_EMPTY_SAMPLE_PATH_TITLE}
          </h3>
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-600 dark:text-neutral-400")}>
            {RUNS_LIST_EMPTY_SAMPLE_PATH_DESCRIPTION}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="border-neutral-300 dark:border-neutral-600">
            <Link href={samplePackageHref} data-testid="runs-list-empty-view-sample">
              {RUNS_LIST_VIEW_SAMPLE_PACKAGE_CTA}
            </Link>
          </Button>
          <RunDemoReviewButton variant="outline" size="sm" />
          <SeedSampleReviewButton label={BUYER_SEED_SAMPLE_WORKSPACE_CTA} variant="outline" size="sm" />
        </div>
      </section>
    </div>
  );
}
