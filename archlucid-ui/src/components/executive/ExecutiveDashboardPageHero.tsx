"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ExecutiveDashboardPageHeroProps = {
  readonly dashboardEmpty: boolean;
};

/** Single explanatory hero for the executive dashboard — purpose, help, and header Start when empty. */
export function ExecutiveDashboardPageHero({
  dashboardEmpty,
}: ExecutiveDashboardPageHeroProps): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  return (
    <header
      className="mb-6 space-y-4 border-b border-neutral-200 pb-4 dark:border-neutral-800"
      data-testid="executive-dashboard-page-hero"
      data-dashboard-empty={dashboardEmpty ? "true" : "false"}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1
            className={cn("m-0 text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.pageTitle)}
            data-testid="executive-summary-heading"
          >
            {v.portfolioPageTitle}
          </h1>
          <p className={cn("m-0 max-w-2xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            {v.portfolioPageLead}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2" data-testid="executive-dashboard-hero-actions">
          <PageContextualHelpButton />
          {dashboardEmpty ? (
            <Button variant="primary" size="sm" asChild>
              <Link href="/reviews/new" className="no-underline" data-testid="executive-dashboard-hero-start-review">
                {v.emptyStatePrimaryAction}
              </Link>
            </Button>
          ) : null}
          <Link
            href={v.portfolioPageLearnMoreHref}
            className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.micro)}
            data-testid="executive-dashboard-hero-learn-more"
          >
            {v.portfolioPageLearnMoreLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
