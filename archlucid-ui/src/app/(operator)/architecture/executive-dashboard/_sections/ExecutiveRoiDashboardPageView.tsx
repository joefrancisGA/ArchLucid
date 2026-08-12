"use client";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import {
  ExecutiveDashboardDataProvider,
  useExecutiveDashboardData,
} from "@/components/executive/ExecutiveDashboardDataContext";
import { ExecutiveDashboardEmptyState } from "@/components/executive/ExecutiveDashboardEmptyState";
import { ExecutiveDashboardLoadingSkeleton } from "@/components/executive/ExecutiveDashboardLoadingSkeleton";
import { ExecutiveDashboardPageHero } from "@/components/executive/ExecutiveDashboardPageHero";
import { ExecutiveDashboardSampleWorkspaceBanner } from "@/components/executive/ExecutiveDashboardSampleWorkspaceBanner";
import type { ExecutiveTimeRange } from "@/lib/executive/executive-time-range";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  hasExecutiveCommittedReviews,
  isExecutiveDashboardEmpty,
  isExecutiveSampleWorkspaceData,
} from "@/lib/executive/executive-dashboard-workspace-state";
import { EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID } from "@/lib/executive/executive-dashboard-route";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ExecutiveDashboardBaselineWarningBanner } from "./ExecutiveDashboardBaselineWarningBanner";
import {
  BusinessImpactSummaryWidgetDeferred,
  ExecutiveComplianceDriftTrendSectionDeferred,
  ExecutiveDashboardHowItWorksDeferred,
  ExecutiveDashboardNextActionSectionDeferred,
  ExecutiveDashboardPrimaryMetricsSectionDeferred,
  ExecutiveDashboardSupportingMetricsSectionDeferred,
  ExecutiveRoiEnvironmentSavingsSectionDeferred,
  ExecutiveRoiSummarySectionDeferred,
  ExecutiveRoiTrendSectionDeferred,
  ExecutiveWorkspaceHealthDashboardDeferred,
  OperatorWelcomeOnboardingDeferred,
  SponsorExportsSectionDeferred,
} from "./executive-roi-dashboard-deferred-chunks";
export type ExecutiveRoiDashboardPageViewProps = {
  readonly surface?: "operator" | "executive";
};

type DashboardSectionsProps = {
  readonly defaultTrendRange: ExecutiveTimeRange;
  readonly surface: "operator" | "executive";
  readonly summary?: ReturnType<typeof useExecutiveDashboardData>["summary"];
  readonly summaryLoading?: boolean;
  readonly summaryError?: string | null;
  readonly driftPoints?: ReturnType<typeof useExecutiveDashboardData>["driftPoints"];
  readonly driftLoading?: boolean;
  readonly driftError?: boolean;
};

function ExecutiveRoiDashboardPortfolioSections({
  defaultTrendRange,
  surface,
  summary,
  summaryLoading,
  summaryError,
  driftPoints,
  driftLoading,
  driftError,
}: DashboardSectionsProps): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const dashboardEmpty = isExecutiveDashboardEmpty(summary, summaryLoading ?? false);
  const hasCommittedReviews = hasExecutiveCommittedReviews(summary);
  const showSampleBanner = isExecutiveSampleWorkspaceData(summary);
  const hasDriftData = (driftPoints?.length ?? 0) > 0;
  const dashboardReady = hasCommittedReviews && summaryLoading !== true;

  return (
    <div data-testid="executive-roi-dashboard-ready" data-ready={dashboardReady ? "true" : "false"}>
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack}>
      {showSampleBanner ? <ExecutiveDashboardSampleWorkspaceBanner /> : null}

      {!dashboardEmpty ? <OperatorWelcomeOnboardingDeferred /> : null}

      <ExecutiveDashboardPageHero dashboardEmpty={dashboardEmpty} />

      {summaryLoading ? <ExecutiveDashboardLoadingSkeleton /> : null}

      {!summaryLoading && dashboardEmpty ? (
        <>
          <ExecutiveDashboardEmptyState />
          {!buyerPolishedShell ? <ExecutiveDashboardHowItWorksDeferred /> : null}
        </>
      ) : null}

      {!summaryLoading && !dashboardEmpty ? (
        <>
          <ExecutiveDashboardNextActionSectionDeferred
            timeRange={defaultTrendRange}
            summary={summary ?? null}
            loading={summaryLoading ?? false}
          />
          <ExecutiveDashboardPrimaryMetricsSectionDeferred summary={summary ?? null} loading={summaryLoading ?? false} />
        </>
      ) : null}

      {hasCommittedReviews ? (
        <SponsorExportsSectionDeferred surface={surface} hasCommittedReviews={hasCommittedReviews} />
      ) : null}

      {hasCommittedReviews ? (
        <section aria-labelledby="executive-findings-heading" className="space-y-4">
          <h2 id="executive-findings-heading" className={`m-0 ${OPERATOR_TYPOGRAPHY.sectionTitle}`}>
            {v.latestFindingsSectionTitle}
          </h2>
          <BusinessImpactSummaryWidgetDeferred summary={summary} loading={summaryLoading} surface={surface} />
          <ExecutiveRoiSummarySectionDeferred
            summary={summary}
            loading={summaryLoading}
            summaryError={summaryError}
            surface={surface}
          />
        </section>
      ) : null}

      {hasCommittedReviews && (hasDriftData || driftLoading) ? (
        <ExecutiveComplianceDriftTrendSectionDeferred
          points={driftPoints}
          loading={driftLoading}
          error={driftError}
        />
      ) : null}

      {hasCommittedReviews ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ExecutiveRoiTrendSectionDeferred defaultTimeRange={defaultTrendRange} showTimeRangeSelector />
          <ExecutiveRoiEnvironmentSavingsSectionDeferred />
        </div>
      ) : null}

      {hasCommittedReviews ? (
        <ExecutiveDashboardSupportingMetricsSectionDeferred
          summary={summary ?? null}
          loading={summaryLoading ?? false}
          showDetailedKpiCards
        />
      ) : null}

      <section
        id={EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID}
        aria-labelledby="executive-workspace-health-heading"
        className="scroll-mt-6"
        data-testid="executive-dashboard-workspace-health-section"
      >
        <ExecutiveWorkspaceHealthDashboardDeferred />
      </section>

      <ExecutiveDashboardBaselineWarningBanner variant="setup" />
    </OperatorPageContainer>
    </div>
  );
}

function ExecutiveRoiDashboardPortfolioView({
  defaultTrendRange,
  surface,
}: {
  readonly defaultTrendRange: ExecutiveTimeRange;
  readonly surface: "operator" | "executive";
}): React.JSX.Element {
  const {
    summary,
    summaryLoading,
    summaryError,
    driftPoints,
    driftLoading,
    driftError,
  } = useExecutiveDashboardData();

  return (
    <ExecutiveRoiDashboardPortfolioSections
      defaultTrendRange={defaultTrendRange}
      surface={surface}
      summary={summary}
      summaryLoading={summaryLoading}
      summaryError={summaryError}
      driftPoints={driftPoints}
      driftLoading={driftLoading}
      driftError={driftError}
    />
  );
}

/**
 * Portfolio layout is the single dashboard experience for both the operator-shell `/dashboard`
 * nav item and any legacy `/executive` callers (TB-608 consolidation) — no separate legacy layout.
 */
export function ExecutiveRoiDashboardPageView({ surface = "operator" }: ExecutiveRoiDashboardPageViewProps) {
  const defaultTrendRange: ExecutiveTimeRange = "quarter";

  return (
    <ExecutiveDashboardDataProvider>
      <ExecutiveRoiDashboardPortfolioView defaultTrendRange={defaultTrendRange} surface={surface} />
    </ExecutiveDashboardDataProvider>
  );
}
