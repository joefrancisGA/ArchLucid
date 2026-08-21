import type { DeferredChunkManifestEntry } from "@/lib/operator/deferred-chunk-manifest";

/** TB-2371 — sponsor ROI dashboard deferred chunk catalog. */
export const SPONSOR_ROI_DASHBOARD_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "sponsor-roi-dashboard-next-action",
    label: "Loading next action",
    variant: "section",
    modulePath: "@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorDashboardNextActionSection",
    exportName: "SponsorDashboardNextActionSection",
  },
  {
    id: "sponsor-roi-dashboard-primary-metrics",
    label: "Loading primary metrics",
    variant: "section",
    modulePath: "@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorDashboardPrimaryMetricsSection",
    exportName: "SponsorDashboardPrimaryMetricsSection",
  },
  {
    id: "sponsor-roi-dashboard-how-it-works",
    label: "Loading dashboard guide",
    variant: "section",
    modulePath: "@/components/sponsor/SponsorDashboardHowItWorks",
    exportName: "SponsorDashboardHowItWorks",
  },
  {
    id: "sponsor-roi-dashboard-exports",
    label: "Loading sponsor exports",
    variant: "section",
    modulePath: "@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorExportsSection",
    exportName: "SponsorExportsSection",
  },
  {
    id: "sponsor-roi-dashboard-business-impact",
    label: "Loading business impact",
    variant: "section",
    modulePath: "@/app/(operator)/architecture/sponsor-dashboard/_sections/BusinessImpactSummaryWidget",
    exportName: "BusinessImpactSummaryWidget",
  },
  {
    id: "sponsor-roi-dashboard-roi-summary",
    label: "Loading ROI summary",
    variant: "section",
    modulePath: "@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiSummarySection",
    exportName: "SponsorRoiSummarySection",
  },
  {
    id: "sponsor-roi-dashboard-compliance-drift-trend",
    label: "Loading compliance drift trend",
    variant: "section",
    modulePath: "@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorComplianceDriftTrendSection",
    exportName: "SponsorComplianceDriftTrendSection",
  },
] as const;
