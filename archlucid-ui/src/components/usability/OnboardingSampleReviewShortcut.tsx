"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DemoDataBadge } from "@/components/usability/DemoDataBadge";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SHOWCASE_STATIC_DEMO_RUN_ID, SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

const sampleReviewHref = `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

/** Prominent one-click sample review entry on the First review guide — no tenant seeding required. */
export function OnboardingSampleReviewShortcut(): React.JSX.Element {
  return (
    <section
      aria-labelledby="onboarding-sample-review-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="onboarding-sample-review-shortcut"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="onboarding-sample-review-heading"
              className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}
            >
              Run sample review first
            </h2>
            <DemoDataBadge />
          </div>
          <p className={cn("m-0 max-w-2xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Open a finalized sample architecture package with {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount} findings and{" "}
            {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.decisionCount} decisions — no setup or input required.
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" asChild data-testid="onboarding-sample-review-open">
          <Link href={sampleReviewHref}>Open sample review</Link>
        </Button>
      </div>
    </section>
  );
}
