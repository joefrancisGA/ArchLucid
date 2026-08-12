"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { useExecutiveDashboardData } from "@/components/executive/ExecutiveDashboardDataContext";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator/operator-last-refreshed-label";
import {
  EXECUTIVE_DASHBOARD_ACTION_REFRESH,
  EXECUTIVE_DASHBOARD_ACTION_REFRESHING,
  EXECUTIVE_DASHBOARD_LAST_REFRESHED_PREFIX,
  EXECUTIVE_DASHBOARD_PAGE_TITLE,
  executiveDashboardPageSubtitle,
} from "@/lib/executive-dashboard-page-copy";

export type ExecutiveDashboardPageHeroProps = {
  readonly dashboardEmpty: boolean;
};

/** Shared `/dashboard` hero — title, lead, contextual help, refresh, and last-refreshed metadata. */
export function ExecutiveDashboardPageHero({
  dashboardEmpty,
}: ExecutiveDashboardPageHeroProps): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;
  const { refreshing, lastRefreshedAt, refreshDashboard } = useExecutiveDashboardData();

  const lastRefreshedLabel = operatorLastRefreshedLabel(lastRefreshedAt);

  return (
    <div
      data-testid="executive-dashboard-page-hero"
      data-dashboard-empty={dashboardEmpty ? "true" : "false"}
    >
      <OperatorPageHeader
        title={EXECUTIVE_DASHBOARD_PAGE_TITLE}
        titleTestId="executive-summary-heading"
        subtitle={executiveDashboardPageSubtitle()}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="executive-dashboard-hero-actions">
            <PageContextualHelpButton />
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="executive-dashboard-refresh-button"
              disabled={refreshing}
              onClick={() => {
                void refreshDashboard();
              }}
            >
              {refreshing ? EXECUTIVE_DASHBOARD_ACTION_REFRESHING : EXECUTIVE_DASHBOARD_ACTION_REFRESH}
            </Button>
            {dashboardEmpty ? (
              <Button variant="primary" size="sm" asChild>
                <Link href="/architecture/reviews/new" className="no-underline" data-testid="executive-dashboard-hero-start-review">
                  {v.emptyStatePrimaryAction}
                </Link>
              </Button>
            ) : (
              <Link
                href={v.portfolioPageLearnMoreHref}
                className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.micro)}
                data-testid="executive-dashboard-hero-learn-more"
              >
                {v.portfolioPageLearnMoreLabel}
              </Link>
            )}
          </div>
        }
        metadata={
          <span
            className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="executive-dashboard-last-refreshed"
            title={operatorLastRefreshedExactLabel(lastRefreshedAt)}
          >
            {EXECUTIVE_DASHBOARD_LAST_REFRESHED_PREFIX}:{" "}
            {refreshing ? EXECUTIVE_DASHBOARD_ACTION_REFRESHING : lastRefreshedLabel}
          </span>
        }
      />
    </div>
  );
}
