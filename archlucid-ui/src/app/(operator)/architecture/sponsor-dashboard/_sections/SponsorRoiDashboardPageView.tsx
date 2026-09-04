"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

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
import { cn } from "@/lib/utils";
import {
  hasSponsorCommittedReviews,
  isSponsorDashboardEmpty,
  isSponsorSampleWorkspaceData,
} from "@/lib/sponsor/sponsor-dashboard-workspace-state";
import {
  SPONSOR_DASHBOARD_HREF,
} from "@/lib/sponsor/sponsor-dashboard-route";
import { resolveSponsorDashboardLatestFinalizedRunId } from "@/lib/resolve-sponsor-dashboard-latest-finalized-run";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  SPONSOR_DASHBOARD_FIRST_VIEWPORT_ID,
  SPONSOR_DASHBOARD_PRIMARY_CONTENT_ID,
  SPONSOR_DASHBOARD_SKIP_LINK_LABEL,
  SPONSOR_DASHBOARD_SKIP_TARGET_ID,
} from "@/lib/sponsor/sponsor-dashboard-page-copy";
import { SponsorDashboardBaselineWarningBanner } from "./SponsorDashboardBaselineWarningBanner";
import { ArchitectureSponsorDashboardClaimOrientationStrip } from "./ArchitectureSponsorDashboardClaimOrientationStrip";
import { SponsorDashboardLatestFinalizedReviewStrip } from "./SponsorDashboardLatestFinalizedReviewStrip";
import { SponsorDashboardPickReviewBeforeKpisStrip } from "./SponsorDashboardPickReviewBeforeKpisStrip";
import { SponsorDashboardReviewCoverageHonestyStrip } from "@/components/sponsor/SponsorDashboardReviewCoverageHonestyStrip";
import { SponsorRoiDashboardNextReviewFooterClient } from "./SponsorRoiDashboardNextReviewFooterClient";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import {
  resolveSponsorDashboardKpiEmphasizedStepId,
  resolveSponsorDashboardKpiSteps,
} from "@/lib/sponsor-dashboard-kpi-checklist";
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
  readonly selectedReviewId: string;
  readonly onSelectReview: (reviewId: string) => void;
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
  selectedReviewId,
  onSelectReview,
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
    summary?.systems?.find((system) => system.runId === latestFinalizedRunId)?.systemName ?? null;
  const reviewPicked = selectedReviewId.trim().length > 0;
  const showKpiSections = hasCommittedReviews && reviewPicked;
  const sponsorDashboardKpiChecklistSteps = resolveSponsorDashboardKpiSteps({
    reviewPicked,
    kpisReviewed: showKpiSections && dashboardReady,
    exportReady: showKpiSections && dashboardReady,
  });
  const sponsorDashboardKpiChecklistEmphasizedStepId = resolveSponsorDashboardKpiEmphasizedStepId({
    reviewPicked,
    kpisReviewed: showKpiSections && dashboardReady,
    exportReady: showKpiSections && dashboardReady,
  });

  return (
    <div data-testid="sponsor-roi-dashboard-ready" data-ready={dashboardReady ? "true" : "false"}>
      <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack}>
        <a
          href={`#${SPONSOR_DASHBOARD_SKIP_TARGET_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {SPONSOR_DASHBOARD_SKIP_LINK_LABEL}
        </a>

        <div
          id={SPONSOR_DASHBOARD_PRIMARY_CONTENT_ID}
          data-testid="sponsor-dashboard-primary-content"
          className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
        >
          <SponsorDashboardPageHero dashboardEmpty={dashboardEmpty} />

          <div
            id={SPONSOR_DASHBOARD_FIRST_VIEWPORT_ID}
            data-testid={SPONSOR_DASHBOARD_FIRST_VIEWPORT_ID}
            className={cn(
              "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
      {showSampleBanner ? <SponsorDashboardSampleWorkspaceBanner /> : null}

      {!dashboardEmpty ? <OperatorWelcomeOnboardingDeferred /> : null}

      {!summaryLoading && !dashboardEmpty && !reviewPicked ? (
        <SponsorDashboardPickReviewBeforeKpisStrip
          selectedReviewId={selectedReviewId}
          onSelectReview={onSelectReview}
        />
      ) : null}

      {!summaryLoading && !dashboardEmpty && reviewPicked ? (
        <>
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="sponsor-dashboard-run-scope-banner"
          >
            {"Sponsor KPIs for review "}
            <span className="font-mono text-al-text-primary">{selectedReviewId}</span>
            {" · "}
            <Link className={OPERATOR_LINK.inline} href={SPONSOR_DASHBOARD_HREF}>
              Clear review scope
            </Link>
            {" · "}
            <Link
              className={OPERATOR_LINK.inline}
              href={`/architecture/reviews/${encodeURIComponent(selectedReviewId.trim())}`}
            >
              Open review
            </Link>
          </p>
          <IntegrationConnectChecklist
            title="KPI checklist"
            steps={sponsorDashboardKpiChecklistSteps}
            emphasizedStepId={sponsorDashboardKpiChecklistEmphasizedStepId}
            testIdPrefix="sponsor-dashboard-kpi"
          />
          <SponsorDashboardReviewCoverageHonestyStrip runId={selectedReviewId} />
        </>
      ) : null}

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

      {!summaryLoading && !dashboardEmpty && showKpiSections ? (
        <>
          <SponsorDashboardNextActionSectionDeferred
            timeRange={defaultTrendRange}
            summary={summary ?? null}
            loading={summaryLoading ?? false}
          />
          <SponsorDashboardPrimaryMetricsSectionDeferred summary={summary ?? null} loading={summaryLoading ?? false} />
        </>
      ) : null}

      {showKpiSections ? (
        <SponsorExportsSectionDeferred surface={surface} hasCommittedReviews={hasCommittedReviews} />
      ) : null}

      {showKpiSections ? (
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
            scopedReviewId={selectedReviewId}
          />
        </section>
      ) : null}

      {showKpiSections && (hasDriftData || driftLoading) ? (
        <SponsorComplianceDriftTrendSectionDeferred
          points={driftPoints}
          loading={driftLoading}
          error={driftError}
        />
      ) : null}

      {showKpiSections ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SponsorRoiTrendSectionDeferred defaultTimeRange={defaultTrendRange} showTimeRangeSelector />
          <SponsorRoiEnvironmentSavingsSectionDeferred />
        </div>
      ) : null}

      {showKpiSections ? (
        <SponsorDashboardSupportingMetricsSectionDeferred
          summary={summary ?? null}
          loading={summaryLoading ?? false}
          showDetailedKpiCards
        />
      ) : null}

      <SponsorDashboardBaselineWarningBanner variant="setup" />

      {reviewPicked ? (
        <SponsorRoiDashboardNextReviewFooterClient runId={selectedReviewId.trim()} />
      ) : null}
          </div>

          <div data-testid="architecture-sponsor-dashboard-orientation-bottom">
            <ArchitectureSponsorDashboardClaimOrientationStrip />
          </div>
        </div>
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const {
    summary,
    summaryLoading,
    summaryError,
    driftPoints,
    driftLoading,
    driftError,
  } = useSponsorDashboardData();

  const onSelectReview = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);

      router.replace(`${SPONSOR_DASHBOARD_HREF}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

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
      selectedReviewId={scopedRunId}
      onSelectReview={onSelectReview}
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
