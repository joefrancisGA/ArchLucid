"use client";

import dynamic from "next/dynamic";

import { DeferredChunkLoading, DEFERRED_CHUNK_LOADING_SURFACE_CLASS } from "@/components/ui/deferred-chunk-loading";
import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";
import { RunDetailExplanationSkeleton } from "./RunDetailDeferredSkeleton";
import { cn } from "@/lib/utils";

function runDetailDeferredLoading(
  label: string,
  heightClass: string,
  extraClassName?: string,
): React.JSX.Element {
  return (
    <DeferredChunkLoading
      label={label}
      className={extraClassName ? cn(heightClass, extraClassName) : heightClass}
    />
  );
}

const technologyBaselineLoading = (
  <section id="technology-baseline" className="scroll-mt-24">
    {runDetailDeferredLoading("Loading technology baseline", "h-28")}
  </section>
);

export const RunDetailTechnologyBaselineSection = createDeferredComponentFromManifest(
  "run-detail-technology-baseline",
  {
    loadingWrapper: () => technologyBaselineLoading,
  },
);

export const RunDetailHolisticCriticPanelDeferred = dynamic(
  () => import("./RunDetailHolisticCriticPanel").then((module) => module.RunDetailHolisticCriticPanel),
  { ssr: false, loading: () => null },
);

export const RunDetailExportDeliverableDialog = dynamic(
  () =>
    import("@/components/usability/ExportDeliverableDialog").then(
      (module) => module.ExportDeliverableDialog,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailGenerateAdrFromRunModal = dynamic(
  () => import("@/components/GenerateAdrFromRunModal").then((module) => module.GenerateAdrFromRunModal),
  { ssr: false, loading: () => null },
);

export const RunDetailCompareToBaselineCta = dynamic(
  () => import("@/components/CompareToBaselineCta").then((module) => module.CompareToBaselineCta),
  {
    ssr: false,
    loading: () => runDetailDeferredLoading("Loading compare to baseline", "h-9 w-44"),
  },
);

export const RunDetailEstimatedLlmCostCardDeferred = createDeferredComponentFromManifest(
  "run-detail-estimated-llm-cost-card",
  { suppressLoading: true },
);

export const RunDetailAgentResultsSummaryCardDeferred = dynamic(
  () => import("@/components/runs/RunAgentResultsSummaryCard").then((module) => module.RunAgentResultsSummaryCard),
  { ssr: false, loading: () => null },
);

export const RunDetailReviewAgentExecutionLogSectionDeferred = dynamic(
  () =>
    import("@/components/reviews/ReviewAgentExecutionLogSection").then(
      (module) => module.ReviewAgentExecutionLogSection,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailRetrievalGroundingSummaryCardDeferred = dynamic(
  () =>
    import("@/components/runs/RunRetrievalGroundingSummaryCard").then(
      (module) => module.RunRetrievalGroundingSummaryCard,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailRunMetadataSectionDeferred = dynamic(
  () =>
    import("./RunDetailRunMetadataSection").then((module) => module.RunDetailRunMetadataSection),
  { ssr: false, loading: () => null },
);

export const RunDetailLastFailureCardDeferred = dynamic(
  () => import("@/components/runs/RunDetailLastFailureCard").then((module) => module.RunDetailLastFailureCard),
  { ssr: false, loading: () => null },
);

export const RunDetailProgressTrackerDeferred = createDeferredComponentFromManifest(
  "run-detail-progress-tracker",
  { suppressLoading: true },
);

export const RunDetailTrustEvidenceCardSectionDeferred = dynamic(
  () =>
    import("@/components/runs/RunTrustEvidenceCardSection").then((module) => module.RunTrustEvidenceCardSection),
  { ssr: false, loading: () => null },
);

export const RunDetailSampleReviewPackageSummaryDeferred = dynamic(
  () => import("@/components/SampleReviewPackageSummary").then((module) => module.SampleReviewPackageSummary),
  { ssr: false, loading: () => null },
);

/** TB-2021 remainder — create-home workspace off sync First Load JS. */
export const RunDetailArchitectureCreatedWorkspaceDeferred = createDeferredComponentFromManifest(
  "run-detail-architecture-created-workspace",
  { suppressLoading: true },
);

export const RunDetailArchitectureCreateWorkItemSectionDeferred = dynamic(
  () =>
    import("@/components/architecture/ArchitectureCreateWorkItemSection").then(
      (module) => module.ArchitectureCreateWorkItemSection,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailArchitectureSponsorSharingPanelDeferred = dynamic(
  () =>
    import("@/components/architecture/ArchitectureSponsorSharingPanel").then(
      (module) => module.ArchitectureSponsorSharingPanel,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailFirstWeekRouteGuidanceDeferred = dynamic(
  () => import("@/components/FirstWeekRouteGuidance").then((module) => module.FirstWeekRouteGuidance),
  { ssr: false, loading: () => null },
);

export const RunDetailColdOpenOrientationDeferred = dynamic(
  () =>
    import("@/components/reviews/RunDetailColdOpenOrientationClient").then(
      (module) => module.RunDetailColdOpenOrientationClient,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailExplanationConfidenceBannerDeferred = dynamic(
  () =>
    import("@/components/runs/RunExplanationConfidenceBanner").then(
      (module) => module.RunExplanationConfidenceBanner,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailGovernanceAlertsDeferred = dynamic(
  () =>
    import("@/components/reviews/RunDetailGovernanceAlerts").then(
      (module) => module.RunDetailGovernanceAlerts,
    ),
  { ssr: false, loading: () => null },
);

/** Activity-tab / details-gated outcome cards — not needed for first paint (TB-933). */
export const RunDetailOutcomeCardsDeferred = createDeferredComponentFromManifest("run-detail-outcome-cards", {
  loadingClassName: "h-40",
});

export const RunDetailWhatIfBranchCompareBannerDeferred = dynamic(
  () =>
    import("@/components/draft-intake/WhatIfBranchCompareBanner").then(
      (module) => module.WhatIfBranchCompareBanner,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailCommitBlockingFindingsBannerDeferred = dynamic(
  () =>
    import("@/components/usability/CommitBlockingFindingsBanner").then(
      (module) => module.CommitBlockingFindingsBanner,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailStalledReviewGuidanceCalloutDeferred = dynamic(
  () =>
    import("@/components/usability/StalledReviewGuidanceCallout").then(
      (module) => module.StalledReviewGuidanceCallout,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailCtoDemoReviewRouteGuardDeferred = dynamic(
  () =>
    import("@/components/cto-demo/CtoDemoReviewRouteGuard").then(
      (module) => module.CtoDemoReviewRouteGuard,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailPolicyPackImpactCalloutDeferred = dynamic(
  () =>
    import("@/components/findings/ReviewDetailPolicyPackImpactSection").then(
      (module) => module.ReviewDetailPolicyPackImpactSection,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailOperatorTechnicalForensicsPanelDeferred = createDeferredComponentFromManifest(
  "run-detail-operator-technical-forensics",
  { suppressLoading: true },
);

const artifactsExportsLoading = (
  <section id="artifacts-exports" className="scroll-mt-24">
    {runDetailDeferredLoading("Loading artifacts and exports", "h-36")}
  </section>
);

/** TB-2021 — export button cluster is tab/Evidence-gated; keep off sync First Load JS. */
export const RunDetailArtifactsExportsSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-artifacts-exports-section",
  {
    loadingWrapper: () => artifactsExportsLoading,
  },
);

const workspaceShellLoading = (
  <div className="space-y-3" role="status" aria-label="Loading review workspace">
    <div className={cn(DEFERRED_CHUNK_LOADING_SURFACE_CLASS, "h-10")} aria-hidden />
    <div className={cn(DEFERRED_CHUNK_LOADING_SURFACE_CLASS, "h-48")} aria-hidden />
  </div>
);

/** TB-2021 remainder — tabbed workspace shell off sync First Load JS. */
export const ReviewDetailWorkspaceDeferred = createDeferredComponentFromManifest(
  "run-detail-review-workspace-shell",
  {
    loadingWrapper: () => workspaceShellLoading,
  },
);

export const RunDetailOverviewPanelClientDeferred = createDeferredComponentFromManifest(
  "run-detail-overview-panel",
  { loadingClassName: "h-48" },
);

const workspaceHeaderLoading = (
  <header className="space-y-3 border-b border-neutral-200 pb-5 dark:border-neutral-800">
    {runDetailDeferredLoading("Loading review header", "h-24")}
  </header>
);

const sectionNavLoading = runDetailDeferredLoading("Loading section navigation", "h-10");

/** TB-2117 — workspace identity chrome off sync First Load JS. */
export const RunDetailWorkspaceHeaderDeferred = createDeferredComponentFromManifest(
  "run-detail-workspace-header",
  {
    loadingWrapper: () => workspaceHeaderLoading,
  },
);

export const RunDetailWorkspaceSummaryStripDeferred = createDeferredComponentFromManifest(
  "run-detail-workspace-summary-strip",
  { loadingClassName: "h-48" },
);

export const RunDetailWorkspaceBlockingBannerDeferred = createDeferredComponentFromManifest(
  "run-detail-workspace-blocking-banner",
  { suppressLoading: true },
);

export const RunDetailWorkspaceStickyActionsDeferred = createDeferredComponentFromManifest(
  "run-detail-workspace-sticky-actions",
  {
    loadingClassName: "h-14 hidden rounded-lg dark:bg-neutral-900/40 lg:block",
  },
);

export const RunDetailSectionNavDeferred = createDeferredComponentFromManifest("run-detail-section-nav", {
  loadingClassName: "h-10",
});

export const RunDetailTabbedSectionNavDeferred = dynamic(
  () => import("@/components/runs/RunDetailTabbedSectionNav").then((module) => module.RunDetailTabbedSectionNav),
  { ssr: false, loading: () => sectionNavLoading },
);

export const BeforeAfterDeltaPanelDeferred = dynamic(
  () => import("@/components/BeforeAfterDeltaPanel").then((module) => module.BeforeAfterDeltaPanel),
  { loading: () => null },
);

export const RecurrenceSchedulePostCommitCardDeferred = dynamic(
  () =>
    import("@/components/governance/RecurrenceSchedulePostCommitCard").then(
      (module) => module.RecurrenceSchedulePostCommitCard,
    ),
  { loading: () => null },
);

export const RunDetailRetrievalGroundingSectionDeferred = dynamic(
  () =>
    import("./RunDetailRetrievalGroundingSection").then(
      (module) => module.RunDetailRetrievalGroundingSection,
    ),
  { loading: () => null },
);

export const RunDetailAdvancedAnalysisSectionDeferred = dynamic(
  () =>
    import("./RunDetailAdvancedAnalysisSection").then((module) => module.RunDetailAdvancedAnalysisSection),
  { loading: () => null },
);

export const RunDetailSponsorBottomLineDeferred = createDeferredComponentFromManifest(
  "run-detail-sponsor-bottom-line",
  { loadingClassName: "h-40" },
);

export const RunDetailSponsorReportCtaCardDeferred = dynamic(
  () =>
    import("./RunDetailExecutiveSummaryCtaCard").then((module) => module.RunDetailSponsorReportCtaCard),
  { ssr: false, loading: () => null },
);

export const ReviewPackagePrimaryActionDeferred = dynamic(
  () =>
    import("./ReviewPackagePrimaryActionTabAware").then((module) => module.ReviewPackagePrimaryActionTabAware),
  { ssr: false, loading: () => null },
);

export const ReviewPackageSponsorHandoffStripDeferred = dynamic(
  () =>
    import("./ReviewPackageSponsorHandoffStrip").then((module) => module.ReviewPackageSponsorHandoffStrip),
  { ssr: false, loading: () => null },
);

export const ReviewPackageDoThisNextStripDeferred = dynamic(
  () => import("./ReviewPackageDoThisNextStrip").then((module) => module.ReviewPackageDoThisNextStrip),
  { ssr: false, loading: () => null },
);

export const RunDetailGovernanceDecisionSectionDeferred = dynamic(
  () =>
    import("./RunDetailGovernanceDecisionSection").then((module) => module.RunDetailGovernanceDecisionSection),
  { ssr: false, loading: () => <RunDetailExplanationSkeleton /> },
);

export const RunDetailReviewPackageSectionDeferred = dynamic(
  () => import("./RunDetailReviewPackageSection").then((module) => module.RunDetailReviewPackageSection),
  { ssr: false, loading: () => null },
);

export const RunDetailSubmittedArchitectureSectionDeferred = dynamic(
  () =>
    import("./RunDetailSubmittedArchitectureSection").then(
      (module) => module.RunDetailSubmittedArchitectureSection,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailGovernanceCtaDeferred = dynamic(
  () => import("./RunDetailGovernanceCta").then((module) => module.RunDetailGovernanceCta),
  { ssr: false, loading: () => null },
);

export const RunDetailCaptureEvidenceSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-capture-evidence-section",
  { suppressLoading: true },
);

export const RunDetailManifestSummarySectionDeferred = createDeferredComponentFromManifest(
  "run-detail-manifest-summary-section",
  { suppressLoading: true },
);

export const RunDetailBuyerPilotConversionSectionDeferred = dynamic(
  () =>
    import("./RunDetailBuyerPilotConversionSection").then(
      (module) => module.RunDetailBuyerPilotConversionSection,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailBuyerModeFallbackBannerDeferred = dynamic(
  () => import("./RunDetailBuyerModeFallbackBanner").then((module) => module.RunDetailBuyerModeFallbackBanner),
  { ssr: false, loading: () => null },
);

/** TB-2142 — evidence tab scope/inventory cluster off sync First Load JS. */
export const RunDetailEvidenceTabPanelDeferred = createDeferredComponentFromManifest("run-detail-evidence-tab", {
  loadingClassName: "h-48",
});

/** TB-2142 — post-finalize share/export row off sync First Load JS. */
export const RunDetailReviewPackageShareRowDeferred = dynamic(
  () => import("./RunDetailReviewPackageShareRow").then((module) => module.RunDetailReviewPackageShareRow),
  { ssr: false, loading: () => null },
);

/** TB-2142 — demo marketing chrome off sync First Load JS. */
export const RunDetailDemoMarketingChromeDeferred = dynamic(
  () => import("./RunDetailDemoMarketingChrome").then((module) => module.RunDetailDemoMarketingChrome),
  { ssr: false, loading: () => null },
);

export const RunDetailManifestSummaryAlertsDeferred = dynamic(
  () => import("./RunDetailManifestSummaryAlerts").then((module) => module.RunDetailManifestSummaryAlerts),
  { ssr: false, loading: () => null },
);

export const RunDetailRunActionsSectionDeferred = dynamic(
  () => import("./RunDetailRunActionsSection").then((module) => module.RunDetailRunActionsSection),
  { ssr: false, loading: () => null },
);

export const HelpPageSituationRegistrarDeferred = createDeferredComponentFromManifest(
  "run-detail-help-page-situation-registrar",
  { suppressLoading: true },
);

export const ReviewGenerationCreatedNoticeDeferred = createDeferredComponentFromManifest(
  "run-detail-review-generation-created-notice",
  { suppressLoading: true },
);

/** Perf wave 8 — below-fold forensics/pipeline/provenance cluster off sync First Load JS. */
export const RunDetailBelowFoldSectionsDeferred = createDeferredComponentFromManifest("run-detail-below-fold", {
  loadingClassName: "h-32",
});

/** Perf wave 10 — mid-band compare/savings leaves off sync First Load JS. */
export const ChangesSinceLastReviewBannerDeferred = createDeferredComponentFromManifest(
  "run-detail-changes-since-last-review",
  { loadingClassName: "h-16" },
);

export const RunSavingsSummaryDeferred = createDeferredComponentFromManifest("run-detail-savings-summary", {
  loadingClassName: "h-24",
});

/** Perf wave 10 — decision-delta panel off sync First Load JS. */
export const RunDetailDecisionDeltaPanelDeferred = createDeferredComponentFromManifest(
  "run-detail-decision-delta",
  { loadingClassName: "h-36" },
);

/** Perf wave 10 — findings/explanation collapsible off sync First Load JS. */
export const RunDetailRunExplanationCollapsibleDeferred = createDeferredComponentFromManifest(
  "run-detail-explanation-collapsible",
  { loadingClassName: "h-48" },
);

/** Perf wave 12 — sponsor walkthrough destination off sync First Load JS. */
export const GoldenSponsorPackageWalkthroughDestinationDeferred = dynamic(
  () =>
    import("@/components/golden-walkthrough/GoldenSponsorPackageWalkthroughDestination").then(
      (module) => module.GoldenSponsorPackageWalkthroughDestination,
    ),
  { ssr: false, loading: () => null },
);

/** Perf wave 14 — create-home evidence archTab off sync First Load JS. */
export const RunDetailCreateHomeEvidencePanelDeferred = createDeferredComponentFromManifest(
  "run-detail-create-home-evidence",
  { loadingClassName: "h-48" },
);

/** Perf wave 14 — create-home activity archTab off sync First Load JS (TB-1832/TB-1834). */
export const RunDetailCreateHomeActivityPanelDeferred = createDeferredComponentFromManifest(
  "run-detail-create-home-activity",
  { loadingClassName: "h-40" },
);

/** Perf wave 14 — activity-tab sources panel off sync First Load JS. */
export const RunDetailActivitySourcesPanelDeferred = createDeferredComponentFromManifest(
  "run-detail-activity-sources",
  { loadingClassName: "h-32" },
);

/** Perf wave 14 — review-package next-step resolver off sync First Load JS. */
export const RunDetailReviewPackageDoThisNextResolvedDeferred = createDeferredComponentFromManifest(
  "run-detail-review-package-do-this-next-resolved",
  { loadingClassName: "h-20" },
);

export const RunDetailReviewPackageSponsorHandoffGateDeferred = createDeferredComponentFromManifest(
  "run-detail-review-package-sponsor-handoff-gate",
  { suppressLoading: true },
);
