"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SeverityTag } from "@/components/ui/severity-tag";
import {
  OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA,
  OPERATOR_HOME_SAMPLE_FINDINGS_HEADING,
  OPERATOR_HOME_SAMPLE_FINDINGS_INCLUDES_LABEL,
  OPERATOR_HOME_SAMPLE_FINDINGS_LEAD,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { SHOWCASE_HOME_SAMPLE_FINDINGS } from "@/lib/showcase-home-sample-findings";
import {
  OPERATOR_HOME_EXAMPLE_TEMPLATE_ID,
  reviewIntakeExampleTemplateHref,
} from "@/lib/operator-home-example-request";

const runSampleReviewHref = reviewIntakeExampleTemplateHref(OPERATOR_HOME_EXAMPLE_TEMPLATE_ID);

/**
 * First-run "Try a sample review" card — merges the former Example request panel and sample
 * findings preview into a single product-tour unit. Hidden once the workspace has a committed review.
 */
export function OperatorHomeSampleReviewPreview(): React.JSX.Element | null {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();

  if (hasCommittedArchitectureReview) {
    return null;
  }

  return (
    <Card
      className={cn(OPERATOR_SURFACE_CARD_CLASS, "border border-neutral-200 shadow-sm dark:border-neutral-800")}
      data-testid="operator-home-sample-review-preview"
      aria-labelledby="operator-home-sample-review-heading"
    >
      <CardHeader className={OPERATOR_CARD.header}>
        <OperatorHomeCardSectionTitle id="operator-home-sample-review-heading">
          {OPERATOR_HOME_SAMPLE_FINDINGS_HEADING}
        </OperatorHomeCardSectionTitle>
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-600 dark:text-neutral-400")}>
          {OPERATOR_HOME_SAMPLE_FINDINGS_LEAD}
        </p>
      </CardHeader>

      <CardContent className={OPERATOR_CARD.content}>
        <p className={cn("m-0 mb-2", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
          <InlineGuidanceLabel
            label={OPERATOR_HOME_SAMPLE_FINDINGS_INCLUDES_LABEL}
            testId="operator-home-sample-review-includes-label"
          />
        </p>
        <ul
          className="m-0 list-none divide-y divide-neutral-200/70 p-0 dark:divide-neutral-800"
          data-testid="operator-home-sample-review-finding-list"
          aria-label="Sample findings included in the review"
        >
          {SHOWCASE_HOME_SAMPLE_FINDINGS.map((finding) => (
            <li
              key={finding.id}
              className="py-2.5"
              data-testid={`operator-home-sample-review-finding-${finding.id}`}
            >
              <div className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-1", OPERATOR_LAYOUT.inlineGap)}>
                <span className={cn(OPERATOR_TYPE_SCALE.helper, "font-medium text-al-text-primary")}>
                  {finding.title}
                </span>
                <span className={cn(OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")} aria-hidden>
                  —
                </span>
                <SeverityTag severity={finding.severity} />
              </div>
              <p className={cn("m-0 mt-1", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
                {finding.summary}
              </p>
            </li>
          ))}
        </ul>

        <div
          className={cn(
            "mt-4 flex flex-wrap items-center border-t border-neutral-200/70 pt-4 dark:border-neutral-800",
            OPERATOR_LAYOUT.inlineGap,
          )}
        >
          <Button asChild variant="outline" size="sm" className="h-8">
            <Link href={runSampleReviewHref} data-testid="operator-home-sample-review-run">
              {OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

