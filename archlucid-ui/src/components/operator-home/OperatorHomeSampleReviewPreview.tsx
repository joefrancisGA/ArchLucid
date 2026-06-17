"use client";

import Link from "next/link";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import {
  BUYER_HOME_PRIMARY_CTA,
  OPERATOR_HOME_SAMPLE_FINDINGS_DEFENSIBLE_LAYER,
  OPERATOR_HOME_SAMPLE_FINDINGS_HEADING,
} from "@/lib/buyer-polish-copy";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SURFACE_CARD_CLASS,
  OPERATOR_TYPOGRAPHY,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { SHOWCASE_HOME_SAMPLE_FINDINGS } from "@/lib/showcase-home-sample-findings";
import { SHOWCASE_BUYER_REVIEW_TITLE, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

const sampleReviewHref = `/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

/**
 * Compact static-demo preview of discovered findings — surfaces value before opening the full review (TB-353).
 */
export function OperatorHomeSampleReviewPreview(): React.JSX.Element | null {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();

  if (hasCommittedArchitectureReview) {
    return null;
  }

  return (
    <section
      aria-labelledby="operator-home-sample-review-preview-heading"
      className={cn(OPERATOR_LAYOUT.sectionStack, OPERATOR_CARD.nested, OPERATOR_SURFACE_CARD_CLASS)}
      data-testid="operator-home-sample-review-preview"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3
            id="operator-home-sample-review-preview-heading"
            className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-al-text-primary")}
          >
            {OPERATOR_HOME_SAMPLE_FINDINGS_HEADING}
          </h3>
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}>
            {SHOWCASE_BUYER_REVIEW_TITLE} — representative findings from the sample package.
          </p>
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}>
            {OPERATOR_HOME_SAMPLE_FINDINGS_DEFENSIBLE_LAYER}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 shrink-0">
          <Link href={sampleReviewHref} data-testid="operator-home-sample-review-open">
            {BUYER_HOME_PRIMARY_CTA}
          </Link>
        </Button>
      </div>

      <ul className="m-0 list-none space-y-2 p-0" data-testid="operator-home-sample-review-findings">
        {SHOWCASE_HOME_SAMPLE_FINDINGS.map((finding) => (
          <li
            key={finding.id}
            className="rounded-md border border-neutral-200/80 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
          >
            <div className="flex flex-wrap items-center gap-2">
              <SeverityTag severity={finding.severity} />
              <span className={cn(OPERATOR_TYPOGRAPHY.cardTitle, "text-al-text-primary")}>{finding.title}</span>
            </div>
            <p className={cn("m-0 mt-1", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}>{finding.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

