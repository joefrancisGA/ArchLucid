"use client";

import dynamic from "next/dynamic";
import type { ComponentType, JSX } from "react";

import { DeferredChunkLoading } from "@/components/ui/deferred-chunk-loading";

import type { ExecutiveComplianceDriftTrendSectionProps } from "./ExecutiveComplianceDriftTrendSection";
import type { ExecutiveDashboardNextActionSectionProps } from "./ExecutiveDashboardNextActionSection";
import type { ExecutiveDashboardPrimaryMetricsSectionProps } from "./ExecutiveDashboardPrimaryMetricsSection";
import type { ExecutiveDashboardSupportingMetricsSectionProps } from "./ExecutiveDashboardSupportingMetricsSection";
import type { ExecutiveRoiTrendSectionProps } from "./ExecutiveRoiTrendSection";
import type { ExecutiveRoiSummarySectionProps } from "./ExecutiveRoiSummarySection";
import type { SponsorExportsSectionProps } from "./SponsorExportsSection";
import type { BusinessImpactSummaryWidgetProps } from "./BusinessImpactSummaryWidget";

function executiveDashboardDeferredLoading(label: string): JSX.Element {
  return (
    <DeferredChunkLoading
      label={label}
      testId="executive-dashboard-deferred-chunk-loading"
    />
  );
}

export const OperatorWelcomeOnboardingDeferred: ComponentType = dynamic(
  () =>
    import("@/components/operator/OperatorWelcomeOnboarding").then(
      (module) => module.OperatorWelcomeOnboarding,
    ),
  {
    ssr: false,
    loading: () => executiveDashboardDeferredLoading("Loading welcome guidance"),
  },
);

export const ExecutiveDashboardNextActionSectionDeferred: ComponentType<ExecutiveDashboardNextActionSectionProps> =
  dynamic(
    () =>
      import("./ExecutiveDashboardNextActionSection").then(
        (module) => module.ExecutiveDashboardNextActionSection,
      ),
    {
      ssr: false,
      loading: () => executiveDashboardDeferredLoading("Loading next action"),
    },
  );

export const ExecutiveDashboardPrimaryMetricsSectionDeferred: ComponentType<ExecutiveDashboardPrimaryMetricsSectionProps> =
  dynamic(
    () =>
      import("./ExecutiveDashboardPrimaryMetricsSection").then(
        (module) => module.ExecutiveDashboardPrimaryMetricsSection,
      ),
    {
      ssr: false,
      loading: () => executiveDashboardDeferredLoading("Loading primary metrics"),
    },
  );

export const ExecutiveDashboardHowItWorksDeferred: ComponentType = dynamic(
  () =>
    import("@/components/executive/ExecutiveDashboardHowItWorks").then(
      (module) => module.ExecutiveDashboardHowItWorks,
    ),
  {
    ssr: false,
    loading: () => executiveDashboardDeferredLoading("Loading dashboard guide"),
  },
);

export const SponsorExportsSectionDeferred: ComponentType<SponsorExportsSectionProps> = dynamic(
  () => import("./SponsorExportsSection").then((module) => module.SponsorExportsSection),
  {
    ssr: false,
    loading: () => executiveDashboardDeferredLoading("Loading sponsor exports"),
  },
);

export const BusinessImpactSummaryWidgetDeferred: ComponentType<BusinessImpactSummaryWidgetProps> =
  dynamic(
    () =>
      import("./BusinessImpactSummaryWidget").then((module) => module.BusinessImpactSummaryWidget),
    {
      ssr: false,
      loading: () => executiveDashboardDeferredLoading("Loading business impact"),
    },
  );

export const ExecutiveRoiSummarySectionDeferred: ComponentType<ExecutiveRoiSummarySectionProps> =
  dynamic(
    () =>
      import("./ExecutiveRoiSummarySection").then((module) => module.ExecutiveRoiSummarySection),
    {
      ssr: false,
      loading: () => executiveDashboardDeferredLoading("Loading ROI summary"),
    },
  );

export const ExecutiveComplianceDriftTrendSectionDeferred: ComponentType<ExecutiveComplianceDriftTrendSectionProps> =
  dynamic(
    () =>
      import("./ExecutiveComplianceDriftTrendSection").then(
        (module) => module.ExecutiveComplianceDriftTrendSection,
      ),
    {
      ssr: false,
      loading: () => (
        executiveDashboardDeferredLoading("Loading compliance drift trend"),
      ),
    },
  );

export const ExecutiveRoiTrendSectionDeferred: ComponentType<ExecutiveRoiTrendSectionProps> =
  dynamic(
    () => import("./ExecutiveRoiTrendSection").then((module) => module.ExecutiveRoiTrendSection),
    {
      ssr: false,
      loading: () => executiveDashboardDeferredLoading("Loading ROI trend"),
    },
  );

export const ExecutiveRoiEnvironmentSavingsSectionDeferred: ComponentType = dynamic(
  () =>
    import("./ExecutiveRoiEnvironmentSavingsSection").then(
      (module) => module.ExecutiveRoiEnvironmentSavingsSection,
    ),
  {
    ssr: false,
    loading: () => executiveDashboardDeferredLoading("Loading environment savings"),
  },
);

export const ExecutiveDashboardSupportingMetricsSectionDeferred: ComponentType<ExecutiveDashboardSupportingMetricsSectionProps> =
  dynamic(
    () =>
      import("./ExecutiveDashboardSupportingMetricsSection").then(
        (module) => module.ExecutiveDashboardSupportingMetricsSection,
      ),
    {
      ssr: false,
      loading: () => executiveDashboardDeferredLoading("Loading supporting metrics"),
    },
  );

export const ExecutiveWorkspaceHealthDashboardDeferred: ComponentType = dynamic(
  () =>
    import("@/components/ExecutiveWorkspaceHealthDashboard").then(
      (module) => module.ExecutiveWorkspaceHealthDashboard,
    ),
  {
    ssr: false,
    loading: () => executiveDashboardDeferredLoading("Loading workspace health"),
  },
);
