"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import { Button } from "@/components/ui/button";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ExecutiveDashboardPageHeroProps = {
  readonly dashboardEmpty: boolean;
};

/** Single explanatory hero for the executive dashboard — purpose, next step, and primary actions. */
export function ExecutiveDashboardPageHero({
  dashboardEmpty,
}: ExecutiveDashboardPageHeroProps): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  return (
    <header
      className="mb-6 space-y-4 border-b border-neutral-200 pb-4 dark:border-neutral-800"
      data-testid="executive-dashboard-page-hero"
    >
      <div className="space-y-2">
        <h2
          className={cn("m-0 text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.pageTitle)}
          data-testid="executive-summary-heading"
        >
          {v.portfolioPageTitle}
        </h2>
        <p className={cn("m-0 max-w-2xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {v.portfolioPageLead}
        </p>

        {dashboardEmpty ? (
          <p className={cn("m-0 max-w-2xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {v.portfolioPageNextStep}
          </p>
        ) : null}
      </div>

      {dashboardEmpty ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button asChild size="sm" variant="primary">
            <Link href="/reviews/new" data-testid="executive-dashboard-hero-start-review">
              {v.emptyStatePrimaryAction}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={getShowcaseExecutiveHref()} data-testid="executive-dashboard-hero-sample-dashboard">
              {v.emptyStateTertiaryAction}
            </Link>
          </Button>
          <SeedSampleReviewButton label={v.emptyStateSecondaryAction} size="sm" />
        </div>
      ) : null}

      <p className="m-0">
        <Link
          href={v.portfolioPageLearnMoreHref}
          className={OPERATOR_LINK.inline}
          data-testid="executive-dashboard-hero-learn-more"
        >
          {v.portfolioPageLearnMoreLabel}
        </Link>
      </p>
    </header>
  );
}
