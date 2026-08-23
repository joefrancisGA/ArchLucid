"use client";

import type { ComponentType, JSX } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import type { SponsorRoiSystemicIssueTrendChartProps } from "@/components/SponsorRoiSystemicIssueTrendChart";

import type { SponsorComplianceDriftTrendSectionProps } from "./SponsorComplianceDriftTrendSection";
import type { SponsorDashboardNextActionSectionProps } from "./SponsorDashboardNextActionSection";
import type { SponsorDashboardPrimaryMetricsSectionProps } from "./SponsorDashboardPrimaryMetricsSection";
import type { SponsorDashboardSupportingMetricsSectionProps } from "./SponsorDashboardSupportingMetricsSection";
import type { SponsorRoiTrendSectionProps } from "./SponsorRoiTrendSection";
import type { SponsorRoiSummarySectionProps } from "./SponsorRoiSummarySection";
import type { SponsorExportsSectionProps } from "./SponsorExportsSection";
import type { BusinessImpactSummaryWidgetProps } from "./BusinessImpactSummaryWidget";
import type { SponsorRoiDashboardPageViewProps } from "./SponsorRoiDashboardPageView";

const sponsorDashboardPageLoadingWrapper = (): JSX.Element => (
  <div
    className="min-h-48 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading sponsor dashboard"
    data-testid="sponsor-dashboard-chunk-loading"
  />
);

const systemicIssueTrendChartLoadingWrapper = (): JSX.Element => (
  <div
    className="h-64 w-full animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-800"
    role="status"
    aria-label="Loading systemic issue trend chart"
  />
);

export const SponsorRoiDashboardPageViewDeferred: ComponentType<SponsorRoiDashboardPageViewProps> =
  createDeferredComponentFromManifest("sponsor-roi-dashboard-page-view", {
    loadingWrapper: sponsorDashboardPageLoadingWrapper,
  }) as ComponentType<SponsorRoiDashboardPageViewProps>;

export const SponsorRoiSystemicIssueTrendChartDeferred: ComponentType<SponsorRoiSystemicIssueTrendChartProps> =
  createDeferredComponentFromManifest("sponsor-roi-dashboard-systemic-issue-trend-chart", {
    loadingWrapper: systemicIssueTrendChartLoadingWrapper,
  }) as ComponentType<SponsorRoiSystemicIssueTrendChartProps>;

export const OperatorWelcomeOnboardingDeferred: ComponentType = createDeferredComponentFromManifest(
  "sponsor-roi-dashboard-welcome-onboarding",
  { loadingTestId: "sponsor-dashboard-deferred-chunk-loading" },
);

export const SponsorDashboardNextActionSectionDeferred: ComponentType<SponsorDashboardNextActionSectionProps> =
  createDeferredComponentFromManifest("sponsor-roi-dashboard-next-action", {
    loadingTestId: "sponsor-dashboard-deferred-chunk-loading",
  });

export const SponsorDashboardPrimaryMetricsSectionDeferred: ComponentType<SponsorDashboardPrimaryMetricsSectionProps> =
  createDeferredComponentFromManifest("sponsor-roi-dashboard-primary-metrics", {
    loadingTestId: "sponsor-dashboard-deferred-chunk-loading",
  });

export const SponsorDashboardHowItWorksDeferred: ComponentType = createDeferredComponentFromManifest(
  "sponsor-roi-dashboard-how-it-works",
  { loadingTestId: "sponsor-dashboard-deferred-chunk-loading" },
);

export const SponsorExportsSectionDeferred: ComponentType<SponsorExportsSectionProps> =
  createDeferredComponentFromManifest("sponsor-roi-dashboard-exports", {
    loadingTestId: "sponsor-dashboard-deferred-chunk-loading",
  });

export const BusinessImpactSummaryWidgetDeferred: ComponentType<BusinessImpactSummaryWidgetProps> =
  createDeferredComponentFromManifest("sponsor-roi-dashboard-business-impact", {
    loadingTestId: "sponsor-dashboard-deferred-chunk-loading",
  });

export const SponsorRoiSummarySectionDeferred: ComponentType<SponsorRoiSummarySectionProps> =
  createDeferredComponentFromManifest("sponsor-roi-dashboard-roi-summary", {
    loadingTestId: "sponsor-dashboard-deferred-chunk-loading",
  });

export const SponsorComplianceDriftTrendSectionDeferred: ComponentType<SponsorComplianceDriftTrendSectionProps> =
  createDeferredComponentFromManifest("sponsor-roi-dashboard-compliance-drift-trend", {
    loadingTestId: "sponsor-dashboard-deferred-chunk-loading",
  });

export const SponsorRoiTrendSectionDeferred: ComponentType<SponsorRoiTrendSectionProps> =
  createDeferredComponentFromManifest("sponsor-roi-dashboard-roi-trend", {
    loadingTestId: "sponsor-dashboard-deferred-chunk-loading",
  });

export const SponsorRoiEnvironmentSavingsSectionDeferred: ComponentType = createDeferredComponentFromManifest(
  "sponsor-roi-dashboard-environment-savings",
  { loadingTestId: "sponsor-dashboard-deferred-chunk-loading" },
);

export const SponsorDashboardSupportingMetricsSectionDeferred: ComponentType<SponsorDashboardSupportingMetricsSectionProps> =
  createDeferredComponentFromManifest("sponsor-roi-dashboard-supporting-metrics", {
    loadingTestId: "sponsor-dashboard-deferred-chunk-loading",
  });

export const SponsorWorkspaceHealthDashboardDeferred: ComponentType = createDeferredComponentFromManifest(
  "sponsor-roi-dashboard-workspace-health",
  { loadingTestId: "sponsor-dashboard-deferred-chunk-loading" },
);
