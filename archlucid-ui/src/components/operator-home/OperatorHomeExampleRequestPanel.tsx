"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BUYER_SEE_COMPLETED_OUTPUT_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import {
  OPERATOR_HOME_EXAMPLE_DESCRIPTION,
  OPERATOR_HOME_EXAMPLE_START_CTA,
  OPERATOR_HOME_EXAMPLE_TEMPLATE_ID,
  reviewIntakeExampleTemplateHref,
} from "@/lib/operator/operator-home-example-request";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";

const sampleReviewHref = `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

/**
 * Inline example architecture question — promoted above the reviews list on first-run home (TB-348).
 */
export function OperatorHomeExampleRequestPanel(): React.JSX.Element | null {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();

  if (hasCommittedArchitectureReview) {
    return null;
  }

  return (
    <Card
      className={cn(OPERATOR_SURFACE_CARD_CLASS, "border border-neutral-200 shadow-sm dark:border-neutral-800")}
      data-testid="operator-home-example-request-panel"
    >
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={cn(OPERATOR_TYPE_SCALE.cardTitle, "text-neutral-900 dark:text-neutral-100")}>
          Example request
        </CardTitle>
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-600 dark:text-neutral-400")}>
          {OPERATOR_HOME_EXAMPLE_DESCRIPTION}
        </p>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap", OPERATOR_LAYOUT.inlineGap)}>
        <Button asChild variant="outline" size="sm" className="h-8">
          <Link
            href={reviewIntakeExampleTemplateHref(OPERATOR_HOME_EXAMPLE_TEMPLATE_ID)}
            data-testid="operator-home-example-request-use"
          >
            {OPERATOR_HOME_EXAMPLE_START_CTA}
          </Link>
        </Button>
        <Button asChild variant="primary" size="sm" className="h-8">
          <Link
            href={sampleReviewHref}
            data-testid="operator-home-example-request-completed"
          >
            {BUYER_SEE_COMPLETED_OUTPUT_CTA}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
