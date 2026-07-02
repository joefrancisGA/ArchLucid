"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityTag } from "@/components/ui/severity-tag";
import {
  OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
  OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA,
  OPERATOR_HOME_SAMPLE_FINDINGS_HEADING,
  OPERATOR_HOME_SAMPLE_FINDINGS_LEAD,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { SHOWCASE_HOME_SAMPLE_FINDINGS } from "@/lib/showcase-home-sample-findings";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";
import {
  OPERATOR_HOME_EXAMPLE_TEMPLATE_ID,
  reviewIntakeExampleTemplateHref,
} from "@/lib/operator-home-example-request";

const openCompletedSampleHref = showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId);
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
    >
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={cn(OPERATOR_TYPE_SCALE.cardTitle, "text-neutral-900 dark:text-neutral-100")}>
          {OPERATOR_HOME_SAMPLE_FINDINGS_HEADING}
        </CardTitle>
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-600 dark:text-neutral-400")}>
          {OPERATOR_HOME_SAMPLE_FINDINGS_LEAD}
        </p>
      </CardHeader>

      <CardContent className={OPERATOR_CARD.content}>
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
                <span className={cn(OPERATOR_TYPE_SCALE.helper, "font-medium text-al-text-secondary")}>
                  {index + 1}.
                </span>
                <span className={cn(OPERATOR_TYPE_SCALE.helper, "font-semibold text-al-text-primary")}>
                  {finding.title}
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">—</span>
                <SeverityTag severity={finding.severity} />
              </div>
              <p className={cn("m-0 mt-1 ml-5", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
                {finding.summary}
              </p>
            </li>
          ))}
        </ul>

        <div className={cn("flex flex-wrap items-center pt-3", OPERATOR_LAYOUT.inlineGap)}>
          <Button asChild variant="outline" size="sm" className="h-8">
            <Link href={runSampleReviewHref} data-testid="operator-home-sample-review-run">
              {OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA}
            </Link>
          </Button>
          <Button asChild variant="primary" size="sm" className="h-8">
            <Link href={openCompletedSampleHref} data-testid="operator-home-sample-review-open">
              {OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

