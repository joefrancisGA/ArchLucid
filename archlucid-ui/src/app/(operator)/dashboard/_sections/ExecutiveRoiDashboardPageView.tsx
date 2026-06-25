"use client";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { ExecutiveDashboardDataProvider, useExecutiveDashboardData } from "@/components/executive/ExecutiveDashboardDataContext";
import { ExecutiveDashboardEmptyState } from "@/components/executive/ExecutiveDashboardEmptyState";
import { ExecutiveDashboardSampleWorkspaceBanner } from "@/components/executive/ExecutiveDashboardSampleWorkspaceBanner";
import { ExecutiveValueNarrativeBanner } from "@/components/ExecutiveValueNarrativeBanner";
import { OperatorPilotOrientationBanner } from "@/components/OperatorPilotOrientationBanner";
import { OperatorWelcomeOnboarding } from "@/components/OperatorWelcomeOnboarding";
import type { ExecutiveTimeRange } from "@/lib/executive-time-range";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  hasExecutiveCommittedReviews,
  isExecutiveDashboardEmpty,
  isExecutiveSampleWorkspaceData,
} from "@/lib/executive-dashboard-workspace-state";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { ExecutiveComplianceDriftTrendSection } from "./ExecutiveComplianceDriftTrendSection";
import { ExecutiveDashboardBaselineWarningBanner } from "./ExecutiveDashboardBaselineWarningBanner";
import { ExecutiveDashboardNextActionSection } from "./ExecutiveDashboardNextActionSection";
import { ExecutiveDashboardPrimaryMetricsSection } from "./ExecutiveDashboardPrimaryMetricsSection";
import { ExecutiveDashboardSupportingMetricsSection } from "./ExecutiveDashboardSupportingMetricsSection";
import { ExecutiveOrphanCandidatesCard } from "./ExecutiveOrphanCandidatesCard";
import { ExecutiveRoiDashboardLiveKpiCards } from "./ExecutiveRoiDashboardLiveKpiCards";
import { ExecutiveRoiEnvironmentSavingsSection } from "./ExecutiveRoiEnvironmentSavingsSection";
import { ExecutiveRoiSummarySection } from "./ExecutiveRoiSummarySection";
import { ExecutiveRoiTrendSection } from "./ExecutiveRoiTrendSection";
import { SponsorExportsSection } from "./SponsorExportsSection";
import { ExecutiveSqlBackupRegionVerificationCard } from "./ExecutiveSqlBackupRegionVerificationCard";
import { BusinessImpactSummaryWidget } from "./BusinessImpactSummaryWidget";
import { QualityGateMetricsTile } from "@/components/QualityGateMetricsTile";

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

function resolvePortfolioPageHeaderCopy(surface: "operator" | "executive"): {
  readonly title: string;
  readonly subtitle: string;
} {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;
  const buyerPolished = isBuyerPolishedOperatorShellEnv();

  if (buyerPolished || surface === "executive") {
    return { title: v.portfolioPageTitle, subtitle: v.portfolioPageLead };
  }

  return { title: v.pageTitle, subtitle: v.pageLead };
}

function ExecutiveRoiDashboardLegacyOperatorSections({
  defaultTrendRange,
}: {
  readonly defaultTrendRange: ExecutiveTimeRange;
}): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  return (
    <OperatorPageContainer variant="dashboard" className="space-y-4">
      <ExecutiveDashboardBaselineWarningBanner />
      <OperatorWelcomeOnboarding />
      <OperatorPilotOrientationBanner />
      <OperatorPageHeader title={v.pageTitle} subtitle={v.pageLead} titleTestId="executive-summary-heading" />

      <section aria-labelledby="exec-roi-heading">
        <h2 id="exec-roi-heading" className="sr-only">
          {v.roiMetricsSrOnly}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ExecutiveRoiDashboardLiveKpiCards />
          <ExecutiveOrphanCandidatesCard />
          <ExecutiveSqlBackupRegionVerificationCard />
        </div>
      </section>

      <BusinessImpactSummaryWidget />

      <QualityGateMetricsTile />

      <section aria-label="Executive portfolio summary and sponsor exports" className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExecutiveRoiSummarySection />
        </div>
        <SponsorExportsSection />
      </section>

      <ExecutiveComplianceDriftTrendSection />

      <div className="grid gap-4 lg:grid-cols-2">
        <ExecutiveRoiTrendSection defaultTimeRange={defaultTrendRange} showTimeRangeSelector />
        <ExecutiveRoiEnvironmentSavingsSection />
      </div>
    </OperatorPageContainer>
  );
}

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
  const headerCopy = resolvePortfolioPageHeaderCopy(surface);
  const dashboardEmpty = isExecutiveDashboardEmpty(summary, summaryLoading ?? false);
  const hasCommittedReviews = hasExecutiveCommittedReviews(summary);
  const showSampleBanner = isExecutiveSampleWorkspaceData(summary);
  const hasDriftData = (driftPoints?.length ?? 0) > 0;

  return (
    <OperatorPageContainer variant="dashboard" className="space-y-6">
      {showSampleBanner ? <ExecutiveDashboardSampleWorkspaceBanner /> : null}

      {!dashboardEmpty ? <OperatorWelcomeOnboarding /> : null}
      {!dashboardEmpty ? <OperatorPilotOrientationBanner /> : null}

      <OperatorPageHeader
        title={headerCopy.title}
        subtitle={headerCopy.subtitle}
        titleTestId="executive-summary-heading"
      />

      {!dashboardEmpty ? (
        <ExecutiveValueNarrativeBanner timeRange={defaultTrendRange} roiSummary={summary} />
      ) : null}

      {dashboardEmpty ? (
        <ExecutiveDashboardEmptyState />
      ) : (
        <>
          <ExecutiveDashboardNextActionSection
            timeRange={defaultTrendRange}
            summary={summary ?? null}
            loading={summaryLoading ?? false}
          />
          <ExecutiveDashboardPrimaryMetricsSection summary={summary ?? null} loading={summaryLoading ?? false} />
        </>
      )}

      <SponsorExportsSection surface={surface} />

      {hasCommittedReviews ? (
        <section aria-labelledby="executive-findings-heading" className="space-y-4">
          <h2 id="executive-findings-heading" className={`m-0 ${OPERATOR_TYPOGRAPHY.sectionTitle}`}>
            {v.latestFindingsSectionTitle}
          </h2>
          <BusinessImpactSummaryWidget summary={summary} loading={summaryLoading} surface={surface} />
          <ExecutiveRoiSummarySection
            summary={summary}
            loading={summaryLoading}
            summaryError={summaryError}
            surface={surface}
          />
        </section>
      ) : null}

      {hasCommittedReviews && (hasDriftData || driftLoading) ? (
        <ExecutiveComplianceDriftTrendSection
          points={driftPoints}
          loading={driftLoading}
          error={driftError}
        />
      ) : null}

      {hasCommittedReviews ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ExecutiveRoiTrendSection defaultTimeRange={defaultTrendRange} showTimeRangeSelector />
          <ExecutiveRoiEnvironmentSavingsSection />
        </div>
      ) : null}

      {hasCommittedReviews ? (
        <ExecutiveDashboardSupportingMetricsSection
          summary={summary ?? null}
          loading={summaryLoading ?? false}
          showDetailedKpiCards
        />
      ) : null}

      <ExecutiveDashboardBaselineWarningBanner variant="setup" />
    </OperatorPageContainer>
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

export function ExecutiveRoiDashboardPageView({ surface = "operator" }: ExecutiveRoiDashboardPageViewProps) {
  const defaultTrendRange: ExecutiveTimeRange = "quarter";
  const usePortfolioLayout = surface === "executive" || isBuyerPolishedOperatorShellEnv();

  if (usePortfolioLayout) {
    return (
      <ExecutiveDashboardDataProvider>
        <ExecutiveRoiDashboardPortfolioView defaultTrendRange={defaultTrendRange} surface={surface} />
      </ExecutiveDashboardDataProvider>
    );
  }

  return <ExecutiveRoiDashboardLegacyOperatorSections defaultTrendRange={defaultTrendRange} />;
}
