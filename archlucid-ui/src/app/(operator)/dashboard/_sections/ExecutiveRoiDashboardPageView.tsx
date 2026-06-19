"use client";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { QualityGateMetricsTile } from "@/components/QualityGateMetricsTile";
import { ExecutiveDashboardDataProvider, useExecutiveDashboardData } from "@/components/executive/ExecutiveDashboardDataContext";
import { ExecutiveValueNarrativeBanner } from "@/components/ExecutiveValueNarrativeBanner";
import { OperatorPilotOrientationBanner } from "@/components/OperatorPilotOrientationBanner";
import { OperatorWelcomeOnboarding } from "@/components/OperatorWelcomeOnboarding";
import type { ExecutiveTimeRange } from "@/lib/executive-time-range";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

import { ExecutiveComplianceDriftTrendSection } from "./ExecutiveComplianceDriftTrendSection";
import { ExecutiveDashboardBaselineWarningBanner } from "./ExecutiveDashboardBaselineWarningBanner";
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

function ExecutiveRoiDashboardSections({
  defaultTrendRange,
  isExecutiveSurface,
  summary,
  summaryLoading,
  summaryError,
  driftPoints,
  driftLoading,
  driftError,
}: DashboardSectionsProps): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  return (
    <OperatorPageContainer variant="dashboard" className="space-y-4">
      <ExecutiveDashboardBaselineWarningBanner />
      {isExecutiveSurface ? (
        <ExecutiveValueNarrativeBanner timeRange={defaultTrendRange} roiSummary={summary} />
      ) : (
        <>
          <OperatorWelcomeOnboarding />
          <OperatorPilotOrientationBanner />
        </>
      )}
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-al-text-primary">
          {v.pageTitle}
        </h1>
        <p className="max-w-3xl text-sm text-neutral-600 dark:text-neutral-300">{v.pageLead}</p>
      </header>

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
