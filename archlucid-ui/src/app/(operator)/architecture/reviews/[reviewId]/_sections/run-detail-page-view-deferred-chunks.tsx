"use client";

import type { ComponentType } from "react";

import { DeferredChunkLoading, DEFERRED_CHUNK_LOADING_SURFACE_CLASS } from "@/components/ui/deferred-chunk-loading";
import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";
import { RunDetailExplanationSkeleton } from "./RunDetailDeferredSkeleton";
import type { RunDetailAuthorityChainSection } from "./RunDetailAuthorityChainSection";
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

const preFinalizeChecklistLoading = (
  <section id="pre-finalize-checklist" className="scroll-mt-24">
    {runDetailDeferredLoading("Loading pre-finalize checklist", "h-28")}
  </section>
);

export const RunDetailPreFinalizeChecklistSection = createDeferredComponentFromManifest(
  "run-detail-pre-finalize-checklist",
  {
    loadingWrapper: () => preFinalizeChecklistLoading,
  },
);

export const RunDetailHolisticCriticPanelDeferred = createDeferredComponentFromManifest(
  "run-detail-holistic-critic-panel",
  { suppressLoading: true },
);

export const RunDetailExportDeliverableDialog = createDeferredComponentFromManifest(
  "run-detail-export-deliverable-dialog",
  { suppressLoading: true },
);

export const RunDetailGenerateAdrFromRunModal = createDeferredComponentFromManifest(
  "run-detail-generate-adr-from-run-modal",
  { suppressLoading: true },
);

export const RunDetailCompareToBaselineCta = createDeferredComponentFromManifest(
  "run-detail-compare-to-baseline-cta",
  { loadingClassName: "h-9 w-44" },
);

export const RunDetailEstimatedLlmCostCardDeferred = createDeferredComponentFromManifest(
  "run-detail-estimated-llm-cost-card",
  { suppressLoading: true },
);

export const RunDetailAgentResultsSummaryCardDeferred = createDeferredComponentFromManifest(
  "run-detail-agent-results-summary-card",
  { suppressLoading: true },
);

export const RunDetailReviewAgentExecutionLogSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-review-agent-execution-log-section",
  { suppressLoading: true },
);

export const RunDetailRetrievalGroundingSummaryCardDeferred = createDeferredComponentFromManifest(
  "run-detail-retrieval-grounding-summary-card",
  { suppressLoading: true },
);

export const RunDetailRunMetadataSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-run-metadata-section",
  { suppressLoading: true },
);

export const RunDetailLastFailureCardDeferred = createDeferredComponentFromManifest(
  "run-detail-last-failure-card",
  { suppressLoading: true },
);

export const RunDetailProgressTrackerDeferred = createDeferredComponentFromManifest(
  "run-detail-progress-tracker",
  { suppressLoading: true },
);

export const RunDetailTrustEvidenceCardSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-trust-evidence-card-section",
  { suppressLoading: true },
);

export const RunDetailSampleReviewPackageSummaryDeferred = createDeferredComponentFromManifest(
  "run-detail-sample-review-package-summary",
  { suppressLoading: true },
);

/** TB-2021 remainder — create-home workspace off sync First Load JS. */
export const RunDetailArchitectureCreatedWorkspaceDeferred = createDeferredComponentFromManifest(
  "run-detail-architecture-created-workspace",
  { suppressLoading: true },
);

export const RunDetailArchitectureCreateWorkItemSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-architecture-create-work-item-section",
  { suppressLoading: true },
);

export const RunDetailArchitectureSponsorSharingPanelDeferred = createDeferredComponentFromManifest(
  "run-detail-architecture-sponsor-sharing-panel",
  { suppressLoading: true },
);

export const RunDetailFirstWeekRouteGuidanceDeferred = createDeferredComponentFromManifest(
  "run-detail-first-week-route-guidance",
  { suppressLoading: true },
);

export const RunDetailColdOpenOrientationDeferred = createDeferredComponentFromManifest(
  "run-detail-cold-open-orientation",
  { suppressLoading: true },
);

export const RunDetailExplanationConfidenceBannerDeferred = createDeferredComponentFromManifest(
  "run-detail-explanation-confidence-banner",
  { suppressLoading: true },
);

export const RunDetailGovernanceAlertsDeferred = createDeferredComponentFromManifest(
  "run-detail-governance-alerts",
  { suppressLoading: true },
);

/** Activity-tab / details-gated outcome cards — not needed for first paint (TB-933). */
export const RunDetailOutcomeCardsDeferred = createDeferredComponentFromManifest("run-detail-outcome-cards", {
  loadingClassName: "h-40",
});

export const RunDetailWhatIfBranchCompareBannerDeferred = createDeferredComponentFromManifest(
  "run-detail-what-if-branch-compare-banner",
  { suppressLoading: true },
);

export const RunDetailCommitBlockingFindingsBannerDeferred = createDeferredComponentFromManifest(
  "run-detail-commit-blocking-findings-banner",
  { suppressLoading: true },
);

export const RunDetailStalledReviewGuidanceCalloutDeferred = createDeferredComponentFromManifest(
  "run-detail-stalled-review-guidance-callout",
  { suppressLoading: true },
);

export const RunDetailCtoDemoReviewRouteGuardDeferred = createDeferredComponentFromManifest(
  "run-detail-cto-demo-review-route-guard",
  { suppressLoading: true },
);

export const RunDetailPolicyPackImpactCalloutDeferred = createDeferredComponentFromManifest(
  "run-detail-policy-pack-impact-callout",
  { suppressLoading: true },
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

export const RunDetailTabbedSectionNavDeferred = createDeferredComponentFromManifest(
  "run-detail-tabbed-section-nav",
  { loadingClassName: "h-10" },
);

export const BeforeAfterDeltaPanelDeferred = createDeferredComponentFromManifest(
  "run-detail-before-after-delta-panel",
  { suppressLoading: true },
);

export const RecurrenceSchedulePostCommitCardDeferred = createDeferredComponentFromManifest(
  "run-detail-recurrence-schedule-post-commit-card",
  { suppressLoading: true },
);

export const RunDetailRetrievalGroundingSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-retrieval-grounding-section",
  { suppressLoading: true },
);

export const RunDetailAuthorityChainSectionDeferred: ComponentType<
  React.ComponentProps<typeof RunDetailAuthorityChainSection>
> = createDeferredComponentFromManifest("run-detail-authority-chain-section", { suppressLoading: true });

export const RunDetailAdvancedAnalysisSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-advanced-analysis-section",
  { suppressLoading: true },
);

export const RunDetailSponsorBottomLineDeferred = createDeferredComponentFromManifest(
  "run-detail-sponsor-bottom-line",
  { loadingClassName: "h-40" },
);

export const RunDetailSponsorReportCtaCardDeferred = createDeferredComponentFromManifest(
  "run-detail-sponsor-report-cta-card",
  { suppressLoading: true },
);

export const ReviewPackagePrimaryActionDeferred = createDeferredComponentFromManifest(
  "run-detail-review-package-primary-action",
  { suppressLoading: true },
);

export const ReviewPackageSponsorHandoffStripDeferred = createDeferredComponentFromManifest(
  "run-detail-review-package-sponsor-handoff-strip",
  { suppressLoading: true },
);

export const ReviewPackageDoThisNextStripDeferred = createDeferredComponentFromManifest(
  "run-detail-review-package-do-this-next-strip",
  { suppressLoading: true },
);

export const RunDetailGovernanceDecisionSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-governance-decision-section",
  {
    loadingWrapper: (_loading) => <RunDetailExplanationSkeleton />,
  },
);

export const RunDetailReviewPackageSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-review-package-section",
  { suppressLoading: true },
);

export const RunDetailSubmittedArchitectureSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-submitted-architecture-section",
  { suppressLoading: true },
);

export const RunDetailGovernanceCtaDeferred = createDeferredComponentFromManifest(
  "run-detail-governance-cta",
  { suppressLoading: true },
);

export const RunDetailCaptureEvidenceSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-capture-evidence-section",
  { suppressLoading: true },
);

export const RunDetailManifestSummarySectionDeferred = createDeferredComponentFromManifest(
  "run-detail-manifest-summary-section",
  { suppressLoading: true },
);

export const RunDetailBuyerPilotConversionSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-buyer-pilot-conversion-section",
  { suppressLoading: true },
);

export const RunDetailBuyerModeFallbackBannerDeferred = createDeferredComponentFromManifest(
  "run-detail-buyer-mode-fallback-banner",
  { suppressLoading: true },
);

/** TB-2142 — evidence tab scope/inventory cluster off sync First Load JS. */
export const RunDetailEvidenceTabPanelDeferred = createDeferredComponentFromManifest("run-detail-evidence-tab", {
  loadingClassName: "h-48",
});

/** TB-2142 — post-finalize share/export row off sync First Load JS. */
export const RunDetailReviewPackageShareRowDeferred = createDeferredComponentFromManifest(
  "run-detail-review-package-share-row",
  { suppressLoading: true },
);

/** TB-2142 — demo marketing chrome off sync First Load JS. */
export const RunDetailDemoMarketingChromeDeferred = createDeferredComponentFromManifest(
  "run-detail-demo-marketing-chrome",
  { suppressLoading: true },
);

export const RunDetailManifestSummaryAlertsDeferred = createDeferredComponentFromManifest(
  "run-detail-manifest-summary-alerts",
  { suppressLoading: true },
);

export const RunDetailRunActionsSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-run-actions-section",
  { suppressLoading: true },
);

export const HelpPageSituationRegistrarDeferred = createDeferredComponentFromManifest(
  "run-detail-help-page-situation-registrar",
  { suppressLoading: true },
);

export const ReviewGenerationCreatedNoticeDeferred = createDeferredComponentFromManifest(
  "run-detail-review-generation-created-notice",
  { suppressLoading: true },
);

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
export const GoldenSponsorPackageWalkthroughDestinationDeferred = createDeferredComponentFromManifest(
  "run-detail-golden-sponsor-walkthrough",
  { suppressLoading: true },
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
