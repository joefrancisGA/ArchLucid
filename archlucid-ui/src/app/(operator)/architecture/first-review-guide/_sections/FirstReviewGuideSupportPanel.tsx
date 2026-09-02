"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { InAppHelpLink } from "@/components/InAppHelpLink";
import { DemoDataBadge } from "@/components/usability/DemoDataBadge";
import { Button } from "@/components/ui/button";
import {
  FIRST_REVIEW_GUIDE_GET_MORE_ROI_COPY,
  FIRST_REVIEW_GUIDE_GET_MORE_TITLE,
  FIRST_REVIEW_GUIDE_OUTCOMES,
  FIRST_REVIEW_GUIDE_OUTCOMES_COMPLETED_TITLE,
  FIRST_REVIEW_GUIDE_OUTCOMES_TITLE,
  FIRST_REVIEW_GUIDE_SAMPLE_REVIEW_RAIL_BODY,
  FIRST_REVIEW_GUIDE_SAMPLE_REVIEW_RAIL_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";
import { resolveFirstReviewGuideOutcomeLinks } from "@/lib/first-review-guide-state";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const sampleReviewHref = `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

type FirstReviewGuideSupportPanelProps = {
  readonly sealedRunId: string | null;
};

export function FirstReviewGuideSupportPanel({ sealedRunId }: FirstReviewGuideSupportPanelProps) {
  const outcomeLinks = sealedRunId !== null ? resolveFirstReviewGuideOutcomeLinks(sealedRunId) : null;
  const hasSealedRecord = sealedRunId !== null;

  return (
    <aside
      aria-labelledby="first-review-guide-resources-heading"
      className="space-y-4"
      data-testid="first-review-guide-support-panel"
    >
      <h2 id="first-review-guide-resources-heading" className="sr-only">
        Review resources
      </h2>

      <section
        aria-labelledby="first-review-guide-outcomes-heading"
        className={cn(OPERATOR_SURFACE_CARD_CLASS, "border border-neutral-200 p-4 dark:border-neutral-800")}
      >
        <h3 id="first-review-guide-outcomes-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {hasSealedRecord ? FIRST_REVIEW_GUIDE_OUTCOMES_COMPLETED_TITLE : FIRST_REVIEW_GUIDE_OUTCOMES_TITLE}
        </h3>
        <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
          {outcomeLinks !== null
            ? outcomeLinks.map((outcome) => (
                <li key={outcome.label}>
                  <Link href={outcome.href} className={OPERATOR_LINK.inline}>
                    {outcome.label}
                  </Link>
                </li>
              ))
            : FIRST_REVIEW_GUIDE_OUTCOMES.map((outcome) => <li key={outcome}>{outcome}</li>)}
        </ul>
      </section>

      {hasSealedRecord ? (
        <section
          aria-labelledby="first-review-guide-sample-rail-heading"
          className={cn(OPERATOR_SURFACE_CARD_CLASS, "border border-neutral-200 p-4 dark:border-neutral-800")}
          data-testid="first-review-guide-sample-rail-card"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="first-review-guide-sample-rail-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {FIRST_REVIEW_GUIDE_SAMPLE_REVIEW_RAIL_TITLE}
            </h3>
            <DemoDataBadge />
          </div>
          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{FIRST_REVIEW_GUIDE_SAMPLE_REVIEW_RAIL_BODY}</p>
          <div className="mt-2">
            <Button asChild size="sm" variant="outline">
              <Link href={sampleReviewHref}>Open sample review</Link>
            </Button>
          </div>
        </section>
      ) : null}

      <section
        aria-labelledby="first-review-guide-get-more-heading"
        className={cn(OPERATOR_SURFACE_CARD_CLASS, "border border-neutral-200 p-4 dark:border-neutral-800")}
        data-testid="first-review-guide-get-more"
      >
        <h3 id="first-review-guide-get-more-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {FIRST_REVIEW_GUIDE_GET_MORE_TITLE}
        </h3>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{FIRST_REVIEW_GUIDE_GET_MORE_ROI_COPY}</p>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
          Step-by-step walkthrough:{" "}
          <InAppHelpLink
            helpSlug="first-architecture-review"
            label={FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE}
            variant="text"
          />
        </p>
        <div className="mt-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/administration/baseline">Configure ROI baseline</Link>
          </Button>
        </div>
      </section>
    </aside>
  );
}
