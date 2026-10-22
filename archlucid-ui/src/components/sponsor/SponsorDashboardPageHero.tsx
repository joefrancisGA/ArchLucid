"use client";

import { useSponsorDashboardData } from "@/components/sponsor/SponsorDashboardDataContext";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
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
import { ARCHITECTURE_SPONSOR_DASHBOARD_CLAIM_DISCIPLINE } from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";

import { SponsorDashboardHeaderActions } from "./SponsorDashboardHeaderActions";

export type SponsorDashboardPageHeroProps = {
  readonly dashboardEmpty: boolean;
};

/** Shared `/dashboard` hero — title, lead, contextual help, refresh, and last-refreshed metadata. */
export function SponsorDashboardPageHero({
  dashboardEmpty,
}: SponsorDashboardPageHeroProps): React.JSX.Element {
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
        claimDiscipline={ARCHITECTURE_SPONSOR_DASHBOARD_CLAIM_DISCIPLINE}
        claimDisciplineTestId="architecture-sponsor-dashboard-claim-discipline"
        actions={
          <SponsorDashboardHeaderActions
            dashboardEmpty={dashboardEmpty}
            refreshing={refreshing}
            onRefresh={() => {
              void refreshDashboard();
            }}
          />
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
