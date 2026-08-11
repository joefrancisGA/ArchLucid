"use client";

import dynamic from "next/dynamic";

import { RunDetailExplanationSkeleton } from "./RunDetailDeferredSkeleton";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const technologyBaselineLoading = (
  <section id="technology-baseline" className="scroll-mt-24">
    <div
      className="h-28 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
      role="status"
      aria-label="Loading technology baseline"
    />
  </section>
);

export const RunDetailTechnologyBaselineSection = dynamic(
  () =>
    import("@/components/reviews/technology-baseline/TechnologyBaselineSection").then(
      (module) => module.TechnologyBaselineSection,
    ),
  { ssr: false, loading: () => technologyBaselineLoading },
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
    loading: () => (
      <div
        className={cn("h-9 w-44 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.body)}
        role="status"
        aria-label="Loading compare to baseline"
      />
    ),
  },
);

export const RunDetailEstimatedLlmCostCardDeferred = dynamic(
  () => import("@/components/RunEstimatedLlmCostCard").then((module) => module.RunEstimatedLlmCostCard),
  { ssr: false, loading: () => null },
);

export const RunDetailAgentResultsSummaryCardDeferred = dynamic(
  () => import("@/components/RunAgentResultsSummaryCard").then((module) => module.RunAgentResultsSummaryCard),
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
    import("@/components/RunRetrievalGroundingSummaryCard").then(
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
  () => import("@/components/RunDetailLastFailureCard").then((module) => module.RunDetailLastFailureCard),
  { ssr: false, loading: () => null },
);

export const RunDetailProgressTrackerDeferred = dynamic(
  () => import("@/components/RunProgressTracker").then((module) => module.RunProgressTracker),
  { ssr: false, loading: () => null },
);

export const RunDetailTrustEvidenceCardSectionDeferred = dynamic(
  () =>
    import("@/components/RunTrustEvidenceCardSection").then((module) => module.RunTrustEvidenceCardSection),
  { ssr: false, loading: () => null },
);

export const RunDetailSampleReviewPackageSummaryDeferred = dynamic(
  () => import("@/components/SampleReviewPackageSummary").then((module) => module.SampleReviewPackageSummary),
  { ssr: false, loading: () => null },
);

export const RunDetailArchitectureCreatedWorkspaceDeferred = dynamic(
  () =>
    import("@/components/architecture/ArchitectureCreatedWorkspace").then(
      (module) => module.ArchitectureCreatedWorkspace,
    ),
  { ssr: false, loading: () => null },
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
    import("@/components/RunExplanationConfidenceBanner").then(
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

const outcomeCardsLoading = (
  <div
    className="h-40 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading outcome cards"
  />
);

/** Activity-tab / details-gated outcome cards — not needed for first paint (TB-933). */
export const RunDetailOutcomeCardsDeferred = dynamic(
  () => import("@/components/RunDetailOutcomeCards").then((module) => module.RunDetailOutcomeCards),
  { ssr: false, loading: () => outcomeCardsLoading },
);

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
    import("@/components/findings/ReviewDetailPolicyPackImpactCallout").then(
      (module) => module.ReviewDetailPolicyPackImpactCallout,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailOperatorTechnicalForensicsPanelDeferred = dynamic(
  () =>
    import("./RunDetailOperatorTechnicalForensicsPanel").then(
      (module) => module.RunDetailOperatorTechnicalForensicsPanel,
    ),
  { ssr: false, loading: () => null },
);

const artifactsExportsLoading = (
  <section id="artifacts-exports" className="scroll-mt-24">
    <div
      className="h-36 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
      role="status"
      aria-label="Loading artifacts and exports"
    />
  </section>
);

/** TB-2021 — export button cluster is tab/Evidence-gated; keep off sync First Load JS. */
export const RunDetailArtifactsExportsSectionDeferred = dynamic(
  () =>
    import("./RunDetailArtifactsExportsSection").then(
      (module) => module.RunDetailArtifactsExportsSection,
    ),
  { ssr: false, loading: () => artifactsExportsLoading },
);

const workspaceShellLoading = (
  <div className="space-y-3" role="status" aria-label="Loading review workspace">
    <div className="h-10 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
    <div className="h-48 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
  </div>
);

/** TB-2021 remainder — tabbed workspace shell off sync First Load JS. */
export const ReviewDetailWorkspaceDeferred = dynamic(
  () => import("@/components/reviews/ReviewDetailWorkspace").then((module) => module.ReviewDetailWorkspace),
  { ssr: false, loading: () => workspaceShellLoading },
);

const overviewPanelLoading = (
  <div
    className="h-48 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading review overview"
  />
);

export const RunDetailOverviewPanelClientDeferred = dynamic(
  () =>
    import("@/components/reviews/RunDetailOverviewPanelClient").then(
      (module) => module.RunDetailOverviewPanelClient,
    ),
  { ssr: false, loading: () => overviewPanelLoading },
);

const workspaceHeaderLoading = (
  <header className="space-y-3 border-b border-neutral-200 pb-5 dark:border-neutral-800">
    <div
      className="h-24 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
      role="status"
      aria-label="Loading review header"
    />
  </header>
);

const workspaceSummaryLoading = (
  <div
    className="h-48 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading decision snapshot"
  />
);

const workspaceStickyActionsLoading = (
  <div
    className="hidden h-14 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/40 lg:block"
    role="status"
    aria-label="Loading review actions"
  />
);

const sectionNavLoading = (
  <div
    className="h-10 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading section navigation"
  />
);

const executiveBottomLineLoading = (
  <div
    className="h-40 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading executive summary"
  />
);

/** TB-2117 — workspace identity chrome off sync First Load JS. */
export const RunDetailWorkspaceHeaderDeferred = dynamic(
  () => import("./RunDetailWorkspaceChrome").then((module) => module.RunDetailWorkspaceHeader),
  { ssr: false, loading: () => workspaceHeaderLoading },
);

export const RunDetailWorkspaceSummaryStripDeferred = dynamic(
  () =>
    import("./RunDetailWorkspaceSummaryStripTabAware").then(
      (module) => module.RunDetailWorkspaceSummaryStripTabAware,
    ),
  { ssr: false, loading: () => workspaceSummaryLoading },
);

export const RunDetailWorkspaceBlockingBannerDeferred = dynamic(
  () => import("./RunDetailWorkspaceChrome").then((module) => module.RunDetailWorkspaceBlockingBanner),
  { ssr: false, loading: () => null },
);

export const RunDetailWorkspaceStickyActionsDeferred = dynamic(
  () => import("./RunDetailWorkspaceStickyActions").then((module) => module.RunDetailWorkspaceStickyActions),
  { ssr: false, loading: () => workspaceStickyActionsLoading },
);

export const RunDetailSectionNavDeferred = dynamic(
  () => import("@/components/RunDetailSectionNav").then((module) => module.RunDetailSectionNav),
  { ssr: false, loading: () => sectionNavLoading },
);

export const RunDetailTabbedSectionNavDeferred = dynamic(
  () => import("@/components/RunDetailTabbedSectionNav").then((module) => module.RunDetailTabbedSectionNav),
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

export const RunDetailExecutiveBottomLineDeferred = dynamic(
  () => import("./RunDetailExecutiveBottomLine").then((module) => module.RunDetailExecutiveBottomLine),
  { ssr: false, loading: () => executiveBottomLineLoading },
);

export const RunDetailExecutiveSummaryCtaCardDeferred = dynamic(
  () => import("./RunDetailExecutiveSummaryCtaCard").then((module) => module.RunDetailExecutiveSummaryCtaCard),
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

export const RunDetailCaptureEvidenceSectionDeferred = dynamic(
  () => import("./RunDetailCaptureEvidenceSection").then((module) => module.RunDetailCaptureEvidenceSection),
  { ssr: false, loading: () => null },
);

export const RunDetailManifestSummarySectionDeferred = dynamic(
  () => import("./RunDetailManifestSummarySection").then((module) => module.RunDetailManifestSummarySection),
  { ssr: false, loading: () => null },
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

const evidenceTabLoading = (
  <div
    className="h-48 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading evidence tab"
  />
);

/** TB-2142 — evidence tab scope/inventory cluster off sync First Load JS. */
export const RunDetailEvidenceTabPanelDeferred = dynamic(
  () => import("./RunDetailEvidenceTabPanel").then((module) => module.RunDetailEvidenceTabPanel),
  { ssr: false, loading: () => evidenceTabLoading },
);

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

export const HelpPageSituationRegistrarDeferred = dynamic(
  () =>
    import("@/components/help/HelpPageSituationRegistrar").then(
      (module) => module.HelpPageSituationRegistrar,
    ),
  { ssr: false, loading: () => null },
);

export const ReviewGenerationCreatedNoticeDeferred = dynamic(
  () =>
    import("@/components/review-intake/ReviewGenerationCreatedNotice").then(
      (module) => module.ReviewGenerationCreatedNotice,
    ),
  { ssr: false, loading: () => null },
);

/** Perf wave 8 — below-fold forensics/pipeline/provenance cluster off sync First Load JS. */
export const RunDetailBelowFoldSectionsDeferred = dynamic(
  () => import("./RunDetailBelowFoldSections").then((module) => module.RunDetailBelowFoldSections),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-32 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
        role="status"
        aria-label="Loading additional review sections"
      />
    ),
  },
);

const midBannerLoading = (
  <div
    className="h-16 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading review changes banner"
  />
);

const savingsSummaryLoading = (
  <div
    className="h-24 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading savings summary"
  />
);

const decisionDeltaLoading = (
  <div
    className="h-36 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading decision delta"
  />
);

const explanationCollapsibleLoading = (
  <div
    className="h-48 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading review explanation"
  />
);

/** Perf wave 10 — mid-band compare/savings leaves off sync First Load JS. */
export const ChangesSinceLastReviewBannerDeferred = dynamic(
  () =>
    import("@/components/ChangesSinceLastReviewBanner").then(
      (module) => module.ChangesSinceLastReviewBanner,
    ),
  { ssr: false, loading: () => midBannerLoading },
);

export const RunSavingsSummaryDeferred = dynamic(
  () => import("@/components/RunSavingsSummary").then((module) => module.RunSavingsSummary),
  { ssr: false, loading: () => savingsSummaryLoading },
);

/** Perf wave 10 — decision-delta panel off sync First Load JS. */
export const RunDetailDecisionDeltaPanelDeferred = dynamic(
  () => import("./RunDetailDecisionDeltaPanel").then((module) => module.RunDetailDecisionDeltaPanel),
  { ssr: false, loading: () => decisionDeltaLoading },
);

/** Perf wave 10 — findings/explanation collapsible off sync First Load JS. */
export const RunDetailRunExplanationCollapsibleDeferred = dynamic(
  () =>
    import("./RunDetailRunExplanationCollapsible").then(
      (module) => module.RunDetailRunExplanationCollapsible,
    ),
  { ssr: false, loading: () => explanationCollapsibleLoading },
);

/** Perf wave 12 — sponsor walkthrough destination off sync First Load JS. */
export const GoldenSponsorPackageWalkthroughDestinationDeferred = dynamic(
  () =>
    import("@/components/golden-walkthrough/GoldenSponsorPackageWalkthroughDestination").then(
      (module) => module.GoldenSponsorPackageWalkthroughDestination,
    ),
  { ssr: false, loading: () => null },
);

const createHomeEvidenceLoading = (
  <div
    className="h-48 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading evidence panel"
  />
);

/** Perf wave 14 — create-home evidence archTab off sync First Load JS. */
export const RunDetailCreateHomeEvidencePanelDeferred = dynamic(
  () =>
    import("./RunDetailCreateHomeEvidencePanel").then((module) => module.RunDetailCreateHomeEvidencePanel),
  { ssr: false, loading: () => createHomeEvidenceLoading },
);

const activitySourcesLoading = (
  <div
    className="h-32 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading activity sources"
  />
);

/** Perf wave 14 — activity-tab sources panel off sync First Load JS. */
export const RunDetailActivitySourcesPanelDeferred = dynamic(
  () => import("./RunDetailActivitySourcesPanel").then((module) => module.RunDetailActivitySourcesPanel),
  { ssr: false, loading: () => activitySourcesLoading },
);

const doThisNextResolvedLoading = (
  <div
    className="h-20 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading next step"
  />
);

/** Perf wave 14 — review-package next-step resolver off sync First Load JS. */
export const RunDetailReviewPackageDoThisNextResolvedDeferred = dynamic(
  () =>
    import("./RunDetailReviewPackageDoThisNextResolved").then(
      (module) => module.RunDetailReviewPackageDoThisNextResolved,
    ),
  { ssr: false, loading: () => doThisNextResolvedLoading },
);

/** Perf wave 14 — sponsor handoff gate off sync First Load JS. */
export const RunDetailPackageChangesSinceFinalizeDeferred = dynamic(
  () =>
    import("./RunDetailPackageChangesSinceFinalizeSection").then(
      (module) => module.RunDetailPackageChangesSinceFinalizeSection,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailReviewPackageSponsorHandoffGateDeferred = dynamic(
  () =>
    import("./RunDetailReviewPackageSponsorHandoffGate").then(
      (module) => module.RunDetailReviewPackageSponsorHandoffGate,
    ),
  { ssr: false, loading: () => null },
);
