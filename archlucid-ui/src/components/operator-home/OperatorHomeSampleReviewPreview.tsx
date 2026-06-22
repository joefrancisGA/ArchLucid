"use client";

import Link from "next/link";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import {
  OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
  OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA,
  OPERATOR_HOME_SAMPLE_FINDINGS_HEADING,
  OPERATOR_HOME_SAMPLE_FINDINGS_LEAD,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { showcasePrimaryFindingHref } from "@/lib/showcase-home-aha-moment";
import { SHOWCASE_HOME_SAMPLE_FINDINGS } from "@/lib/showcase-home-sample-findings";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";
import { cn } from "@/lib/utils";

const fullExampleReviewHref = showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId);
const firstFindingHref = showcasePrimaryFindingHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId);

/**
 * First-run sample review preview — guided preview of representative findings.
 */
export function OperatorHomeSampleReviewPreview(): React.JSX.Element | null {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();

  if (hasCommittedArchitectureReview) {
    return null;
  }

  return (
    <section
      aria-labelledby="sample-review-preview-heading"
      className={cn(OPERATOR_CARD.nested, "space-y-4 p-4")}
      data-testid="operator-home-sample-review-preview"
    >
      <div className="space-y-1">
        <h3
          id="sample-review-preview-heading"
          className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-al-text-primary")}
        >
          {OPERATOR_HOME_SAMPLE_FINDINGS_HEADING}
        </h3>
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}>
          {OPERATOR_HOME_SAMPLE_FINDINGS_LEAD}
        </p>
      </div>

      <ul
        className="m-0 list-none space-y-2 p-0"
        data-testid="operator-home-sample-review-finding-list"
      >
        {SHOWCASE_HOME_SAMPLE_FINDINGS.map((finding, index) => (
          <li
            key={finding.id}
            className="rounded-md border border-neutral-200/80 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
            data-testid={`operator-home-sample-review-finding-${finding.id}`}
          >
            <div className={cn("flex flex-wrap items-center gap-2", OPERATOR_LAYOUT.inlineGap)}>
              <span className={cn(OPERATOR_TYPE_SCALE.meta, "font-medium text-al-text-secondary")}>
                {index + 1}.
              </span>
              <span className={cn(OPERATOR_TYPE_SCALE.meta, "font-semibold text-al-text-primary")}>
                {finding.title}
              </span>
              <span className="text-neutral-300 dark:text-neutral-700">—</span>
              <SeverityTag severity={finding.severity} />
            </div>
            <p className={cn("m-0 mt-1 ml-5", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}>
              {finding.summary}
            </p>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button asChild variant="outline" size="sm" className="h-8">
          <Link href={firstFindingHref} data-testid="operator-home-sample-review-open">
            {OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA}
          </Link>
        </Button>
        <Button asChild variant="primary" size="sm" className="h-8">
          <Link href={fullExampleReviewHref} data-testid="operator-home-sample-review-open-full">
            {OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA}
          </Link>
        </Button>
      </div>
    </section>
  );
}
