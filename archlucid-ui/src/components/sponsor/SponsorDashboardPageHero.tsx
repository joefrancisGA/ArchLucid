"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { useSponsorDashboardData } from "@/components/sponsor/SponsorDashboardDataContext";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  operatorFreshnessMetadataWithClockLabel,
} from "@/lib/operator/operator-last-refreshed-label";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import {
  SPONSOR_DASHBOARD_ACTION_REFRESHING,
  SPONSOR_DASHBOARD_LAST_REFRESHED_PREFIX,
  SPONSOR_DASHBOARD_PAGE_TITLE,
  executiveDashboardPageSubtitle,
} from "@/lib/sponsor-dashboard-page-copy";

export type SponsorDashboardPageHeroProps = {
  readonly dashboardEmpty: boolean;
};

/** Shared `/dashboard` hero — title, lead, contextual help, refresh, and last-refreshed metadata. */
export function SponsorDashboardPageHero({
  dashboardEmpty,
}: SponsorDashboardPageHeroProps): React.JSX.Element {
  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;
  const { refreshing, lastRefreshedAt, refreshDashboard } = useSponsorDashboardData();

  const freshnessLabel = refreshing
    ? SPONSOR_DASHBOARD_ACTION_REFRESHING
    : operatorFreshnessMetadataWithClockLabel({
        prefix: SPONSOR_DASHBOARD_LAST_REFRESHED_PREFIX,
        lastRefreshedAt,
        refreshingLabel: null,
      });

  return (
    <div
      data-testid="sponsor-dashboard-page-hero"
      data-dashboard-empty={dashboardEmpty ? "true" : "false"}
    >
      <OperatorPageHeader
        navHref={SPONSOR_DASHBOARD_HREF}
        title={SPONSOR_DASHBOARD_PAGE_TITLE}
        titleTestId="sponsor-report-heading"
        subtitle={executiveDashboardPageSubtitle()}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="sponsor-dashboard-hero-actions">
            <PageContextualHelpButton />
            <RefreshButton
              data-testid="sponsor-dashboard-refresh-button"
              busy={refreshing}
              onClick={() => {
                void refreshDashboard();
              }}
            />
            {dashboardEmpty ? (
              <Button variant="primary" size="sm" asChild>
                <Link href="/architecture/reviews/new" className="no-underline" data-testid="sponsor-dashboard-hero-start-review">
                  {v.emptyStatePrimaryAction}
                </Link>
              </Button>
            ) : (
              <Link
                href={v.portfolioPageLearnMoreHref}
                className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.micro)}
                data-testid="sponsor-dashboard-hero-learn-more"
              >
                {v.portfolioPageLearnMoreLabel}
              </Link>
            )}
          </div>
        }
        metadata={
          <OperatorPageFreshnessMetadata
            testId="sponsor-dashboard-last-refreshed"
            lastRefreshedAt={refreshing ? null : lastRefreshedAt}
          >
            {freshnessLabel}
          </OperatorPageFreshnessMetadata>
        }
      />
    </div>
  );
}
