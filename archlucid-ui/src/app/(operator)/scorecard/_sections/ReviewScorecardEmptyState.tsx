"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE,
  REVIEW_SCORECARD_EMPTY_DESCRIPTION,
  REVIEW_SCORECARD_EMPTY_PRIMARY_ACTION,
  REVIEW_SCORECARD_EMPTY_SECONDARY_ACTION,
  REVIEW_SCORECARD_EMPTY_TITLE,
  REVIEW_SCORECARD_OPEN_PACKAGES_ACTION,
  REVIEW_SCORECARD_PREVIEW_METRICS,
  REVIEW_SCORECARD_PREVIEW_SECTION_TITLE,
  REVIEW_SCORECARD_SAMPLE_HREF,
  REVIEW_SCORECARD_VIEW_SAMPLE_ACTION,
} from "@/lib/review-scorecard-empty-state";

function ReviewScorecardPlaceholderMetric(props: {
  readonly label: string;
  readonly detail: string;
}): ReactElement {
  return (
    <div
      className="rounded-md border border-dashed border-neutral-200 bg-neutral-50/70 px-3 py-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid={`review-scorecard-preview-metric-${props.label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <p className={cn("m-0 mt-1 text-neutral-400 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.kpiValue)}>—</p>
      <p className={cn("m-0 mt-1 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {props.detail}
      </p>
    </div>
  );
}

/** Intentional empty state for the operator Review scorecard when no reviews are committed. */
export function ReviewScorecardEmptyState(): ReactElement {
  return (
    <div className="space-y-4" data-testid="review-scorecard-empty-state">
      <EnterpriseCompactEmptyState
        testId="review-scorecard-empty"
        title={REVIEW_SCORECARD_EMPTY_TITLE}
        description={REVIEW_SCORECARD_EMPTY_DESCRIPTION}
        actions={[
          { label: REVIEW_SCORECARD_EMPTY_PRIMARY_ACTION, href: "/reviews/new", variant: "primary" },
        ]}
        footer={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/reviews/new">{REVIEW_SCORECARD_EMPTY_SECONDARY_ACTION}</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/reviews">{REVIEW_SCORECARD_OPEN_PACKAGES_ACTION}</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={REVIEW_SCORECARD_SAMPLE_HREF}>{REVIEW_SCORECARD_VIEW_SAMPLE_ACTION}</Link>
            </Button>
          </div>
        }
      />

      <p
        className={cn("m-0 max-w-3xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="review-scorecard-data-requirement-note"
      >
        {REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE}
      </p>

      <section
        aria-labelledby="review-scorecard-empty-preview-heading"
        className="space-y-3"
        data-testid="review-scorecard-empty-preview"
      >
        <h2 id="review-scorecard-empty-preview-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {REVIEW_SCORECARD_PREVIEW_SECTION_TITLE}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {REVIEW_SCORECARD_PREVIEW_METRICS.map((metric) => (
            <ReviewScorecardPlaceholderMetric
              key={metric.label}
              label={metric.label}
              detail={metric.placeholderDetail}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
