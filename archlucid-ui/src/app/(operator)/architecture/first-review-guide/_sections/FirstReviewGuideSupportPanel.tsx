"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { InAppHelpLink } from "@/components/InAppHelpLink";
import { Button } from "@/components/ui/button";
import {
  FIRST_REVIEW_GUIDE_GET_MORE_ROI_COPY,
  FIRST_REVIEW_GUIDE_GET_MORE_TITLE,
  FIRST_REVIEW_GUIDE_HELP_TITLE,
  FIRST_REVIEW_GUIDE_OUTCOMES,
  FIRST_REVIEW_GUIDE_OUTCOMES_TITLE,
  FIRST_REVIEW_GUIDE_TEMPLATE_BODY,
  FIRST_REVIEW_GUIDE_TEMPLATE_CHOOSE_ACTION,
  FIRST_REVIEW_GUIDE_TEMPLATE_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";
import { REVIEWS_NEW_DETAILED_HREF } from "@/lib/reviews-new-path-copy";

export function FirstReviewGuideSupportPanel() {
  return (
    <aside className="space-y-4" data-testid="first-review-guide-support-panel">
      <section
        aria-labelledby="first-review-guide-outcomes-heading"
        className={cn(OPERATOR_SURFACE_CARD_CLASS, "border border-neutral-200 p-4 dark:border-neutral-800")}
      >
        <h3 id="first-review-guide-outcomes-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {FIRST_REVIEW_GUIDE_OUTCOMES_TITLE}
        </h3>
        <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
          {FIRST_REVIEW_GUIDE_OUTCOMES.map((outcome) => (
            <li key={outcome}>{outcome}</li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="first-review-guide-template-heading"
        className={cn(OPERATOR_SURFACE_CARD_CLASS, "border border-neutral-200 p-4 dark:border-neutral-800")}
        data-testid="first-review-guide-template-card"
      >
        <h3 id="first-review-guide-template-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {FIRST_REVIEW_GUIDE_TEMPLATE_LABEL}
        </h3>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{FIRST_REVIEW_GUIDE_TEMPLATE_BODY}</p>
        <div className="mt-2">
          <Button asChild size="sm" variant="outline">
            <Link href={REVIEWS_NEW_DETAILED_HREF}>{FIRST_REVIEW_GUIDE_TEMPLATE_CHOOSE_ACTION}</Link>
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="first-review-guide-get-more-heading"
        className={cn(OPERATOR_SURFACE_CARD_CLASS, "border border-neutral-200 p-4 dark:border-neutral-800")}
        data-testid="first-review-guide-get-more"
      >
        <h3 id="first-review-guide-get-more-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {FIRST_REVIEW_GUIDE_GET_MORE_TITLE}
        </h3>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{FIRST_REVIEW_GUIDE_GET_MORE_ROI_COPY}</p>
        <div className="mt-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/administration/baseline">Configure ROI baseline</Link>
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="first-review-guide-help-heading"
        className={cn(OPERATOR_SURFACE_CARD_CLASS, "border border-neutral-200 p-4 dark:border-neutral-800")}
        data-testid="first-review-guide-help"
      >
        <h3 id="first-review-guide-help-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {FIRST_REVIEW_GUIDE_HELP_TITLE}
        </h3>
        <ul className={cn("m-0 mt-2 space-y-2", OPERATOR_TYPOGRAPHY.body)}>
          <li>
            <InAppHelpLink
              helpSlug="first-architecture-review"
              label={FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE}
              variant="text"
            />
          </li>
        </ul>
      </section>
    </aside>
  );
}
