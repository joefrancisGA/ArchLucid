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
  FIRST_REVIEW_GUIDE_TEMPLATE_CHOOSE_ACTION,
  FIRST_REVIEW_GUIDE_TEMPLATE_LABEL,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";
import {
  OPERATOR_HOME_EXAMPLE_TEMPLATE_ID,
  REVIEW_INTAKE_EXAMPLE_TEMPLATES,
  reviewIntakeExampleTemplateHref,
} from "@/lib/operator-home-example-request";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

function resolveDefaultTemplateTitle(): string {
  const match = REVIEW_INTAKE_EXAMPLE_TEMPLATES.find((row) => row.id === OPERATOR_HOME_EXAMPLE_TEMPLATE_ID);

  return match?.title ?? "Default template";
}

export function FirstReviewGuideSupportPanel() {
  const sampleHref = `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;
  const templateTitle = resolveDefaultTemplateTitle();
  const templateHref = reviewIntakeExampleTemplateHref(OPERATOR_HOME_EXAMPLE_TEMPLATE_ID);

  return (
    <aside className="space-y-4" data-testid="first-review-guide-support-panel">
      <section
        aria-labelledby="first-review-guide-outcomes-heading"
        className={cn(OPERATOR_SURFACE_CARD_CLASS, "border border-neutral-200 p-4 dark:border-neutral-800")}
      >
        <h2 id="first-review-guide-outcomes-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {FIRST_REVIEW_GUIDE_OUTCOMES_TITLE}
        </h2>
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
        <h2 id="first-review-guide-template-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {FIRST_REVIEW_GUIDE_TEMPLATE_LABEL}
        </h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
          Current value: <span className="font-medium text-neutral-900 dark:text-neutral-100">{templateTitle}</span>
        </p>
        <div className="mt-2">
          <Button asChild size="sm" variant="outline">
            <Link href={templateHref}>{FIRST_REVIEW_GUIDE_TEMPLATE_CHOOSE_ACTION}</Link>
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="first-review-guide-get-more-heading"
        className={cn(OPERATOR_SURFACE_CARD_CLASS, "border border-neutral-200 p-4 dark:border-neutral-800")}
        data-testid="first-review-guide-get-more"
      >
        <h2 id="first-review-guide-get-more-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {FIRST_REVIEW_GUIDE_GET_MORE_TITLE}
        </h2>
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
        <h2 id="first-review-guide-help-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {FIRST_REVIEW_GUIDE_HELP_TITLE}
        </h2>
        <ul className={cn("m-0 mt-2 space-y-2", OPERATOR_TYPOGRAPHY.body)}>
          <li>
            <InAppHelpLink
              helpSlug="first-architecture-review"
              label={FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE}
              variant="text"
            />
          </li>
          <li>
            <Link className={OPERATOR_LINK.inline} href={sampleHref}>
              Explore a sample review
            </Link>
          </li>
        </ul>
      </section>
    </aside>
  );
}
