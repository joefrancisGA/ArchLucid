"use client";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { QualityGateMetricsTile } from "@/components/QualityGateMetricsTile";
import { ExecutiveDashboardDataProvider, useExecutiveDashboardData } from "@/components/executive/ExecutiveDashboardDataContext";
import { ExecutiveDashboardEmptyState } from "@/components/executive/ExecutiveDashboardEmptyState";
import { ExecutiveDashboardSampleWorkspaceBanner } from "@/components/executive/ExecutiveDashboardSampleWorkspaceBanner";
import { ExecutiveValueNarrativeBanner } from "@/components/ExecutiveValueNarrativeBanner";
import { OperatorPilotOrientationBanner } from "@/components/OperatorPilotOrientationBanner";
import { OperatorWelcomeOnboarding } from "@/components/OperatorWelcomeOnboarding";
import type { ExecutiveTimeRange } from "@/lib/executive-time-range";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import {
  hasExecutiveCommittedReviews,
  isExecutiveDashboardEmpty,
  isExecutiveSampleWorkspaceData,
} from "@/lib/executive-dashboard-workspace-state";

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

export type ExecutiveRoiDashboardPageViewProps = {
  readonly surface?: "operator" | "executive";
};

type DashboardSectionsProps = {
  readonly defaultTrendRange: ExecutiveTimeRange;
  readonly isExecutiveSurface: boolean;
  readonly summary?: ReturnType<typeof useExecutiveDashboardData>["summary"];
  readonly summaryLoading?: boolean;
  readonly summaryError?: string | null;
  readonly driftPoints?: ReturnType<typeof useExecutiveDashboardData>["driftPoints"];
  readonly driftLoading?: boolean;
  readonly driftError?: boolean;
};

function ExecutiveRoiDashboardOperatorSections({
  defaultTrendRange,
  summary,
  summaryLoading,
  summaryError,
  driftPoints,
  driftLoading,
  driftError,
}: Omit<DashboardSectionsProps, "isExecutiveSurface">): React.JSX.Element {
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
          <ExecutiveRoiDashboardLiveKpiCards summary={summary} loading={summaryLoading} />
          <ExecutiveOrphanCandidatesCard />
          <ExecutiveSqlBackupRegionVerificationCard />
        </div>
      </section>

      <BusinessImpactSummaryWidget summary={summary} loading={summaryLoading} />

      <QualityGateMetricsTile />

      <section aria-label="Executive portfolio summary and sponsor exports" className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExecutiveRoiSummarySection
            summary={summary}
            loading={summaryLoading}
            summaryError={summaryError}
          />
        </div>
        <SponsorExportsSection />
      </section>

      <ExecutiveComplianceDriftTrendSection
        points={driftPoints}
        loading={driftLoading}
        error={driftError}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ExecutiveRoiTrendSection defaultTimeRange={defaultTrendRange} showTimeRangeSelector />
        <ExecutiveRoiEnvironmentSavingsSection />
      </div>
    </OperatorPageContainer>
  );
}

function ExecutiveRoiDashboardExecutiveSections({
  defaultTrendRange,
  summary,
  summaryLoading,
  summaryError,
  driftPoints,
  driftLoading,
  driftError,
}: Omit<DashboardSectionsProps, "isExecutiveSurface">): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;
  const dashboardEmpty = isExecutiveDashboardEmpty(summary, summaryLoading ?? false);
  const hasCommittedReviews = hasExecutiveCommittedReviews(summary);
  const showSampleBanner = isExecutiveSampleWorkspaceData(summary);

  return (
    <OperatorPageContainer variant="dashboard" className="space-y-6">
      <ExecutiveDashboardBaselineWarningBanner />
      {showSampleBanner ? <ExecutiveDashboardSampleWorkspaceBanner /> : null}

      <OperatorPageHeader title={v.pageTitle} subtitle={v.pageLead} titleTestId="executive-summary-heading" />

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

      {hasCommittedReviews ? (
        <section aria-labelledby="executive-findings-heading" className="space-y-4">
          <h2 id="executive-findings-heading" className="m-0 text-base font-semibold text-al-text-primary">
            {v.latestFindingsSectionTitle}
          </h2>
          <BusinessImpactSummaryWidget summary={summary} loading={summaryLoading} surface="executive" />
          <ExecutiveRoiSummarySection
            summary={summary}
            loading={summaryLoading}
            summaryError={summaryError}
            surface="executive"
          />
        </section>
      ) : null}

      <section aria-label="Executive exports and compliance drift" className="grid gap-4 lg:grid-cols-3">
        <div className={hasCommittedReviews ? "lg:col-span-2" : "lg:col-span-3"}>
          <ExecutiveComplianceDriftTrendSection
            points={driftPoints}
            loading={driftLoading}
            error={driftError}
          />
        </div>
        <SponsorExportsSection surface="executive" />
      </section>

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
    </OperatorPageContainer>
  );
}

function ExecutiveRoiDashboardSections(props: DashboardSectionsProps): React.JSX.Element {
  if (props.isExecutiveSurface) {
    return (
      <ExecutiveRoiDashboardExecutiveSections
        defaultTrendRange={props.defaultTrendRange}
        summary={props.summary}
        summaryLoading={props.summaryLoading}
        summaryError={props.summaryError}
        driftPoints={props.driftPoints}
        driftLoading={props.driftLoading}
        driftError={props.driftError}
      />
    );
  }

  return (
    <ExecutiveRoiDashboardOperatorSections
      defaultTrendRange={props.defaultTrendRange}
      summary={props.summary}
      summaryLoading={props.summaryLoading}
      summaryError={props.summaryError}
      driftPoints={props.driftPoints}
      driftLoading={props.driftLoading}
      driftError={props.driftError}
    />
  );
}

function ExecutiveRoiDashboardExecutiveView({
  defaultTrendRange,
}: {
  readonly defaultTrendRange: ExecutiveTimeRange;
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
    <ExecutiveRoiDashboardSections
      defaultTrendRange={defaultTrendRange}
      isExecutiveSurface
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

  if (surface === "executive") {
    return (
      <ExecutiveDashboardDataProvider>
        <ExecutiveRoiDashboardExecutiveView defaultTrendRange={defaultTrendRange} />
      </ExecutiveDashboardDataProvider>
    );
  }

  return (
    <ExecutiveRoiDashboardSections
      defaultTrendRange={defaultTrendRange}
      isExecutiveSurface={false}
    />
  );
}
