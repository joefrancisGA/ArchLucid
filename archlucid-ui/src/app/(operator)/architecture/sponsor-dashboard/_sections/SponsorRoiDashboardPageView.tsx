"use client";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import {
  SponsorDashboardDataProvider,
  useSponsorDashboardData,
} from "@/components/sponsor/SponsorDashboardDataContext";
import { SponsorDashboardEmptyState } from "@/components/sponsor/SponsorDashboardEmptyState";
import { SponsorDashboardLoadingSkeleton } from "@/components/sponsor/SponsorDashboardLoadingSkeleton";
import { SponsorDashboardPageHero } from "@/components/sponsor/SponsorDashboardPageHero";
import { SponsorDashboardSampleWorkspaceBanner } from "@/components/sponsor/SponsorDashboardSampleWorkspaceBanner";
import type { SponsorTimeRange } from "@/lib/sponsor/sponsor-time-range";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  hasSponsorCommittedReviews,
  isSponsorDashboardEmpty,
  isSponsorSampleWorkspaceData,
} from "@/lib/sponsor/sponsor-dashboard-workspace-state";
import { SPONSOR_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID } from "@/lib/sponsor/sponsor-dashboard-route";
import { resolveSponsorDashboardLatestFinalizedRunId } from "@/lib/resolve-sponsor-dashboard-latest-finalized-run";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SponsorDashboardBaselineWarningBanner } from "./SponsorDashboardBaselineWarningBanner";
import { SponsorDashboardLatestFinalizedReviewStrip } from "./SponsorDashboardLatestFinalizedReviewStrip";
import {
  BusinessImpactSummaryWidgetDeferred,
  SponsorComplianceDriftTrendSectionDeferred,
  SponsorDashboardHowItWorksDeferred,
  SponsorDashboardNextActionSectionDeferred,
  SponsorDashboardPrimaryMetricsSectionDeferred,
  SponsorDashboardSupportingMetricsSectionDeferred,
  SponsorRoiEnvironmentSavingsSectionDeferred,
  SponsorRoiSummarySectionDeferred,
  SponsorRoiTrendSectionDeferred,
  SponsorWorkspaceHealthDashboardDeferred,
  OperatorWelcomeOnboardingDeferred,
  SponsorExportsSectionDeferred,
} from "./sponsor-roi-dashboard-deferred-chunks";
export type SponsorRoiDashboardPageViewProps = {
  readonly surface?: "operator" | "sponsor";
};

type DashboardSectionsProps = {
  readonly defaultTrendRange: SponsorTimeRange;
  readonly surface: "operator" | "sponsor";
  readonly summary?: ReturnType<typeof useSponsorDashboardData>["summary"];
  readonly summaryLoading?: boolean;
  readonly summaryError?: string | null;
  readonly driftPoints?: ReturnType<typeof useSponsorDashboardData>["driftPoints"];
  readonly driftLoading?: boolean;
  readonly driftError?: boolean;
};

function SponsorRoiDashboardPortfolioSections({
  defaultTrendRange,
  surface,
  summary,
  summaryLoading,
  summaryError,
  driftPoints,
  driftLoading,
  driftError,
}: DashboardSectionsProps): React.JSX.Element {
  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const dashboardEmpty = isSponsorDashboardEmpty(summary, summaryLoading ?? false);
  const hasCommittedReviews = hasSponsorCommittedReviews(summary);
  const showSampleBanner = isSponsorSampleWorkspaceData(summary);
  const hasDriftData = (driftPoints?.length ?? 0) > 0;
  const dashboardReady = hasCommittedReviews && summaryLoading !== true;
  const latestFinalizedRunId = resolveSponsorDashboardLatestFinalizedRunId(summary);
  const latestFinalizedReviewTitle =
    summary?.systems.find((system) => system.runId === latestFinalizedRunId)?.systemName ?? null;

  return (
    <div data-testid="sponsor-roi-dashboard-ready" data-ready={dashboardReady ? "true" : "false"}>
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack}>
      {showSampleBanner ? <SponsorDashboardSampleWorkspaceBanner /> : null}

      {!dashboardEmpty ? <OperatorWelcomeOnboardingDeferred /> : null}

      <SponsorDashboardPageHero dashboardEmpty={dashboardEmpty} />

      {latestFinalizedRunId !== null && hasCommittedReviews && !summaryLoading ? (
        <SponsorDashboardLatestFinalizedReviewStrip
          runId={latestFinalizedRunId}
          reviewTitle={latestFinalizedReviewTitle}
        />
      ) : null}

      {summaryLoading ? <SponsorDashboardLoadingSkeleton /> : null}

      {!summaryLoading && dashboardEmpty ? (
        <>
          <SponsorDashboardEmptyState />
          {!buyerPolishedShell ? <SponsorDashboardHowItWorksDeferred /> : null}
        </>
      ) : null}

      {!summaryLoading && !dashboardEmpty ? (
        <>
          <SponsorDashboardNextActionSectionDeferred
            timeRange={defaultTrendRange}
            summary={summary ?? null}
            loading={summaryLoading ?? false}
          />
          <SponsorDashboardPrimaryMetricsSectionDeferred summary={summary ?? null} loading={summaryLoading ?? false} />
        </>
      ) : null}

      {hasCommittedReviews ? (
        <SponsorExportsSectionDeferred surface={surface} hasCommittedReviews={hasCommittedReviews} />
      ) : null}

      {hasCommittedReviews ? (
        <section aria-labelledby="sponsor-findings-heading" className="space-y-4">
          <h2 id="sponsor-findings-heading" className={`m-0 ${OPERATOR_TYPOGRAPHY.sectionTitle}`}>
            {v.latestFindingsSectionTitle}
          </h2>
          <BusinessImpactSummaryWidgetDeferred summary={summary} loading={summaryLoading} surface={surface} />
          <SponsorRoiSummarySectionDeferred
            summary={summary}
            loading={summaryLoading}
            summaryError={summaryError}
            surface={surface}
          />
        </section>
      ) : null}

      {hasCommittedReviews && (hasDriftData || driftLoading) ? (
        <SponsorComplianceDriftTrendSectionDeferred
          points={driftPoints}
          loading={driftLoading}
          error={driftError}
        />
      ) : null}

      {hasCommittedReviews ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SponsorRoiTrendSectionDeferred defaultTimeRange={defaultTrendRange} showTimeRangeSelector />
          <SponsorRoiEnvironmentSavingsSectionDeferred />
        </div>
      ) : null}

      {hasCommittedReviews ? (
        <SponsorDashboardSupportingMetricsSectionDeferred
          summary={summary ?? null}
          loading={summaryLoading ?? false}
          showDetailedKpiCards
        />
      ) : null}

      <section
        id={SPONSOR_DASHBOARD_WORKSPACE_HEALTH_SECTION_ID}
        aria-labelledby="sponsor-workspace-health-heading"
        className="scroll-mt-24"
        data-testid="sponsor-dashboard-workspace-health-section"
      >
        <SponsorWorkspaceHealthDashboardDeferred />
      </section>

      <SponsorDashboardBaselineWarningBanner variant="setup" />
    </OperatorPageContainer>
    </div>
  );
}

function SponsorRoiDashboardPortfolioView({
  defaultTrendRange,
  surface,
}: {
  readonly defaultTrendRange: SponsorTimeRange;
  readonly surface: "operator" | "sponsor";
}): React.JSX.Element {
  const {
    summary,
    summaryLoading,
    summaryError,
    driftPoints,
    driftLoading,
    driftError,
  } = useSponsorDashboardData();

  return (
    <SponsorRoiDashboardPortfolioSections
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
 * nav item and any legacy `/sponsor` callers (TB-608 consolidation) — no separate legacy layout.
 */
export function SponsorRoiDashboardPageView({ surface = "operator" }: SponsorRoiDashboardPageViewProps) {
  const defaultTrendRange: SponsorTimeRange = "quarter";

  return (
    <SponsorDashboardDataProvider>
      <SponsorRoiDashboardPortfolioView defaultTrendRange={defaultTrendRange} surface={surface} />
    </SponsorDashboardDataProvider>
  );
}
