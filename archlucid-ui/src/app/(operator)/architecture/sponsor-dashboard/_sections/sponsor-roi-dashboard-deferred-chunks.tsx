"use client";

import dynamic from "next/dynamic";
import type { ComponentType, JSX } from "react";

import { DeferredChunkLoading } from "@/components/ui/deferred-chunk-loading";
import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import type { SponsorComplianceDriftTrendSectionProps } from "./SponsorComplianceDriftTrendSection";
import type { SponsorDashboardNextActionSectionProps } from "./SponsorDashboardNextActionSection";
import type { SponsorDashboardPrimaryMetricsSectionProps } from "./SponsorDashboardPrimaryMetricsSection";
import type { SponsorDashboardSupportingMetricsSectionProps } from "./SponsorDashboardSupportingMetricsSection";
import type { SponsorRoiTrendSectionProps } from "./SponsorRoiTrendSection";
import type { SponsorRoiSummarySectionProps } from "./SponsorRoiSummarySection";
import type { SponsorExportsSectionProps } from "./SponsorExportsSection";
import type { BusinessImpactSummaryWidgetProps } from "./BusinessImpactSummaryWidget";

function executiveDashboardDeferredLoading(label: string): JSX.Element {
  return (
    <DeferredChunkLoading
      label={label}
      testId="sponsor-dashboard-deferred-chunk-loading"
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

export const SponsorDashboardNextActionSectionDeferred: ComponentType<SponsorDashboardNextActionSectionProps> =
  createDeferredComponentFromManifest("sponsor-roi-dashboard-next-action", {
    loadingTestId: "sponsor-dashboard-deferred-chunk-loading",
  });

export const SponsorDashboardPrimaryMetricsSectionDeferred: ComponentType<SponsorDashboardPrimaryMetricsSectionProps> =
  dynamic(
    () =>
      import("./SponsorDashboardPrimaryMetricsSection").then(
        (module) => module.SponsorDashboardPrimaryMetricsSection,
      ),
    {
      ssr: false,
      loading: () => executiveDashboardDeferredLoading("Loading primary metrics"),
    },
  );

export const SponsorDashboardHowItWorksDeferred: ComponentType = dynamic(
  () =>
    import("@/components/sponsor/SponsorDashboardHowItWorks").then(
      (module) => module.SponsorDashboardHowItWorks,
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

export const SponsorRoiSummarySectionDeferred: ComponentType<SponsorRoiSummarySectionProps> =
  dynamic(
    () =>
      import("./SponsorRoiSummarySection").then((module) => module.SponsorRoiSummarySection),
    {
      ssr: false,
      loading: () => executiveDashboardDeferredLoading("Loading ROI summary"),
    },
  );

export const SponsorComplianceDriftTrendSectionDeferred: ComponentType<SponsorComplianceDriftTrendSectionProps> =
  dynamic(
    () =>
      import("./SponsorComplianceDriftTrendSection").then(
        (module) => module.SponsorComplianceDriftTrendSection,
      ),
    {
      ssr: false,
      loading: () => executiveDashboardDeferredLoading("Loading compliance drift trend"),
    },
  );

export const SponsorRoiTrendSectionDeferred: ComponentType<SponsorRoiTrendSectionProps> =
  dynamic(
    () => import("./SponsorRoiTrendSection").then((module) => module.SponsorRoiTrendSection),
    {
      ssr: false,
      loading: () => executiveDashboardDeferredLoading("Loading ROI trend"),
    },
  );

export const SponsorRoiEnvironmentSavingsSectionDeferred: ComponentType = dynamic(
  () =>
    import("./SponsorRoiEnvironmentSavingsSection").then(
      (module) => module.SponsorRoiEnvironmentSavingsSection,
    ),
  {
    ssr: false,
    loading: () => executiveDashboardDeferredLoading("Loading environment savings"),
  },
);

export const SponsorDashboardSupportingMetricsSectionDeferred: ComponentType<SponsorDashboardSupportingMetricsSectionProps> =
  dynamic(
    () =>
      import("./SponsorDashboardSupportingMetricsSection").then(
        (module) => module.SponsorDashboardSupportingMetricsSection,
      ),
    {
      ssr: false,
      loading: () => executiveDashboardDeferredLoading("Loading supporting metrics"),
    },
  );

export const SponsorWorkspaceHealthDashboardDeferred: ComponentType = dynamic(
  () =>
    import("@/components/SponsorWorkspaceHealthDashboard").then(
      (module) => module.SponsorWorkspaceHealthDashboard,
    ),
  {
    ssr: false,
    loading: () => executiveDashboardDeferredLoading("Loading workspace health"),
  },
);
