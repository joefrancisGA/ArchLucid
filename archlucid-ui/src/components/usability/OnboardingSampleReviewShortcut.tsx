"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DemoDataBadge } from "@/components/usability/DemoDataBadge";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_CHECKLIST,
  FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_HEADING,
  FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_LEAD,
  FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_NOT_YET,
} from "@/lib/first-review-sample-sealed-package-copy";
import { isLiveOperatorShellRecoveryContext } from "@/lib/live-operator-shell-recovery";
import { resolveScopedInsightOpenReviewHrefWithDeskContinuity } from "@/lib/insights/scoped-insight-open-review-href";
import { SHOWCASE_STATIC_DEMO_RUN_ID, SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

const sampleReviewHref = resolveScopedInsightOpenReviewHrefWithDeskContinuity(SHOWCASE_STATIC_DEMO_RUN_ID);

/** Prominent one-click sample review entry on the First review guide — no tenant seeding required. */
export function OnboardingSampleReviewShortcut(): React.JSX.Element | null {
  if (isLiveOperatorShellRecoveryContext()) {
    return null;
  }

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
              Open a sample architecture package first
            </h2>
            <DemoDataBadge />
          </div>
          <p className={cn("m-0 max-w-2xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Open a finalized sample architecture package with {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount} findings and{" "}
            {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.decisionCount} decisions — no setup or input required.
          </p>
          <div
            className="mt-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="onboarding-sample-sealed-package-checklist"
          >
            <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.helper)}>
              {FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_HEADING}
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_LEAD}</p>
            <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.helper)}>Sample includes</p>
            <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
              {FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_CHECKLIST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.helper)}>Not yet your sealed review</p>
            <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
              {FIRST_REVIEW_SAMPLE_SEALED_PACKAGE_NOT_YET.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" asChild data-testid="onboarding-sample-review-open">
          <Link href={sampleReviewHref}>Open sample review</Link>
        </Button>
      </div>
    </section>
  );
}
