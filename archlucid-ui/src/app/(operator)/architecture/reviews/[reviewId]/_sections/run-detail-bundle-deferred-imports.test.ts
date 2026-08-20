import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sectionsDir = dirname(fileURLToPath(import.meta.url));

const pageViewSource = readFileSync(join(sectionsDir, "RunDetailPageView.tsx"), "utf8");

const deferredChunksSource = readFileSync(
  join(sectionsDir, "run-detail-page-view-deferred-chunks.tsx"),
  "utf8",
);

const manifestLoaderSource = readFileSync(
  join(sectionsDir, "../../../../../../lib/operator/load-deferred-chunk-from-manifest.tsx"),
  "utf8",
);

const explanationCollapsibleSource = readFileSync(
  join(sectionsDir, "RunDetailRunExplanationCollapsible.tsx"),
  "utf8",
);

const belowFoldSource = readFileSync(join(sectionsDir, "RunDetailBelowFoldSections.tsx"), "utf8");

const midDeferredSource = readFileSync(join(sectionsDir, "RunDetailMidDeferredSections.tsx"), "utf8");

const decisionDeltaDeferredSource = readFileSync(
  join(sectionsDir, "RunDetailDecisionDeltaDeferred.tsx"),
  "utf8",
);

const explanationDeferredSource = readFileSync(
  join(sectionsDir, "RunDetailExplanationDeferred.tsx"),
  "utf8",
);

const bannedStaticImports = [
  '@/components/runs/RunEstimatedLlmCostCard"',
  '@/components/runs/RunAgentResultsSummaryCard"',
  '@/components/reviews/ReviewAgentExecutionLogSection"',
  '@/components/runs/RunRetrievalGroundingSummaryCard"',
  '@/components/runs/RunProgressTracker"',
  '@/components/runs/RunTrustEvidenceCardSection"',
  '@/components/SampleReviewPackageSummary"',
  '@/components/architecture/ArchitectureCreatedWorkspace"',
  '@/components/architecture/ArchitectureCreateWorkItemSection"',
  '@/components/architecture/ArchitectureSponsorSharingPanel"',
  '@/components/FirstWeekRouteGuidance"',
  '@/components/runs/RunExplanationConfidenceBanner"',
  '@/components/reviews/RunDetailGovernanceAlerts"',
  '@/components/runs/RunDetailOutcomeCards"',
  '@/components/draft-intake/WhatIfBranchCompareBanner"',
  '@/components/usability/CommitBlockingFindingsBanner"',
  '@/components/usability/StalledReviewGuidanceCallout"',
  '@/components/cto-demo/CtoDemoReviewRouteGuard"',
  '@/components/findings/ReviewDetailPolicyPackImpactCallout"',
  '@/components/runs/RunDetailLastFailureCard"',
  '@/components/reviews/ReviewWorkspaceShell"',
  '@/components/reviews/RunDetailOverviewPanelClient"',
  '@/components/runs/RunDetailSectionNav"',
  './RunDetailOperatorTechnicalForensicsPanel"',
  './RunDetailArtifactsExportsSection"',
  './RunDetailWorkspaceChrome"',
  './RunDetailWorkspaceStickyActions"',
  './ReviewPackagePrimaryAction"',
  './ReviewPackageDoThisNextStrip"',
  './RunDetailSponsorBottomLine"',
  './RunDetailManifestSummarySection"',
  './RunDetailSubmittedArchitectureSection"',
  './RunDetailCaptureEvidenceSection"',
  './RunDetailBuyerPilotConversionSection"',
  './RunDetailBuyerModeFallbackBanner"',
  './RunDetailExecutiveSummaryCtaCard"',
  './RunDetailGovernanceDecisionSection"',
  './RunDetailReviewPackageSection"',
  './RunDetailGovernanceCta"',
  '@/components/operator/OperatorDemoStaticBanner"',
  '@/components/usability/DemoDataBadge"',
  '@/components/usability/PersistentSponsorEmailStrip"',
  '@/components/usability/ShareableReviewLinkButton"',
  '@/components/runs/RunDetailEvidenceInventorySection"',
  '@/components/runs/RunDetailEvidenceScopeHeader"',
  '@/components/help/HelpPageSituationRegistrar"',
  '@/components/review-intake/ReviewGenerationCreatedNotice"',
  '@/components/reviews/ReviewSealedIndicatorChip"',
  './RunDetailManifestSummaryAlerts"',
  './RunDetailRunActionsSection"',
  './RunDetailEvidenceTabPanel"',
  './RunDetailReviewPackageShareRow"',
  './RunDetailDemoMarketingChrome"',
  './RunDetailBelowFoldSections"',
  '@/components/ChangesSinceLastReviewBanner"',
  '@/components/RunSavingsSummary"',
  './RunDetailDecisionDeltaPanel"',
  './RunDetailRunExplanationCollapsible"',
  './RunDetailCreateHomeEvidencePanel"',
  './RunDetailActivitySourcesPanel"',
  './resolve-review-package-primary-action"',
  './resolve-review-package-do-this-next"',
  '@/components/golden-walkthrough/GoldenSponsorPackageWalkthroughDestination"',
] as const;

describe("run detail bundle deferred imports (TB-697 / TB-933 / TB-2021 / TB-2117 / TB-2142)", () => {
  it("keeps heavy review-detail modules off the page view static import graph", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(pageViewSource).not.toContain(bannedImport);
    }

    expect(pageViewSource).toContain("RunDetailWorkspaceHeaderDeferred");
    expect(pageViewSource).toContain("RunDetailWorkspaceSummaryStripDeferred");
    expect(pageViewSource).toContain("RunDetailWorkspaceBlockingBannerDeferred");
    expect(pageViewSource).toContain("RunDetailReviewPackageDoThisNextResolvedDeferred");
    expect(pageViewSource).toContain("RunDetailReviewPackageSponsorHandoffGateDeferred");
    expect(pageViewSource).toContain("RunDetailCreateHomeEvidencePanelDeferred");
    expect(pageViewSource).toContain("RunDetailCreateHomeActivityPanelDeferred");
    expect(pageViewSource).toContain("RunDetailActivitySourcesPanelDeferred");
    expect(pageViewSource).not.toContain("ReviewPackageDoThisNextStripDeferred");
    expect(pageViewSource).not.toContain("RunDetailWorkspaceStickyActionsDeferred");
    expect(pageViewSource).not.toContain("ReviewPackagePrimaryActionDeferred");
    expect(pageViewSource).toContain("RunDetailSponsorBottomLineDeferred");
    expect(pageViewSource).toContain("RunDetailSectionNavDeferred");
    expect(pageViewSource).not.toContain("RunDetailTabbedSectionNavDeferred");
    expect(pageViewSource).toContain("RunDetailManifestSummarySectionDeferred");
    expect(pageViewSource).toContain("RunDetailSubmittedArchitectureSectionDeferred");
    expect(pageViewSource).toContain("RunDetailCaptureEvidenceSectionDeferred");
    expect(pageViewSource).toContain("RunDetailBuyerPilotConversionSectionDeferred");
    expect(pageViewSource).toContain("RunDetailSponsorReportCtaCardDeferred");
    expect(pageViewSource).toContain("RunDetailGovernanceDecisionSectionDeferred");
    expect(pageViewSource).toContain("RunDetailReviewPackageSectionDeferred");
    expect(pageViewSource).toContain("RunDetailBuyerModeFallbackBannerDeferred");
    expect(pageViewSource).toContain("RunDetailGovernanceCtaDeferred");
    expect(pageViewSource).toContain("RunDetailEvidenceTabPanelDeferred");
    expect(pageViewSource).toContain("RunDetailReviewPackageShareRowDeferred");
    expect(pageViewSource).toContain("RunDetailDemoMarketingChromeDeferred");
    expect(pageViewSource).toContain("RunDetailManifestSummaryAlertsDeferred");
    expect(pageViewSource).toContain("RunDetailRunActionsSectionDeferred");
    expect(pageViewSource).toContain("HelpPageSituationRegistrarDeferred");
    expect(pageViewSource).toContain("ReviewGenerationCreatedNoticeDeferred");
    expect(pageViewSource).toContain("RunDetailBelowFoldSectionsDeferred");
    expect(pageViewSource).not.toContain("GoldenSponsorPackageWalkthroughDestinationDeferred");
    expect(deferredChunksSource).toContain(
      'import("@/components/golden-walkthrough/GoldenSponsorPackageWalkthroughDestination")',
    );
    expect(pageViewSource).toContain("RunDetailWorkspaceShell");
    expect(pageViewSource).not.toContain("./RunDetailWorkspaceChrome");
    expect(pageViewSource).toContain("ReviewDetailWorkspaceDeferred");
    expect(pageViewSource).toContain("RunDetailOverviewPanelClientDeferred");
    expect(pageViewSource).toContain("RunDetailOperatorTechnicalForensicsPanelDeferred");
    expect(pageViewSource).toContain("RunDetailOutcomeCardsDeferred");
    expect(pageViewSource).toContain("RunDetailArtifactsExportsSectionDeferred");
    expect(pageViewSource).toContain("run-detail-page-view-deferred-chunks");
    expect(pageViewSource).toContain("@/components/resolve-run-detail-last-failure-summary");
  });

  it("dynamic-imports operator forensics and activity-tab chunks", () => {
    expect(deferredChunksSource).toContain("RunDetailEstimatedLlmCostCardDeferred");
    expect(deferredChunksSource).toContain("createDeferredComponentFromManifest");
    expect(deferredChunksSource).toContain('"run-detail-review-workspace-shell"');
    expect(deferredChunksSource).toContain('"run-detail-overview-panel"');
    expect(deferredChunksSource).toContain('"run-detail-evidence-tab"');
    expect(deferredChunksSource).toContain('"run-detail-below-fold"');
    expect(deferredChunksSource).toContain('"run-detail-architecture-created-workspace"');
    expect(deferredChunksSource).toContain('"run-detail-create-home-evidence"');
    expect(deferredChunksSource).toContain('"run-detail-create-home-activity"');
    expect(deferredChunksSource).toContain('"run-detail-technology-baseline"');
    expect(deferredChunksSource).toContain('"run-detail-changes-since-last-review"');
    expect(deferredChunksSource).toContain('"run-detail-savings-summary"');
    expect(deferredChunksSource).toContain('"run-detail-decision-delta"');
    expect(deferredChunksSource).toContain('"run-detail-explanation-collapsible"');
    expect(deferredChunksSource).toContain('"run-detail-activity-sources"');
    expect(deferredChunksSource).toContain('"run-detail-workspace-header"');
    expect(deferredChunksSource).toContain('"run-detail-workspace-summary-strip"');
    expect(deferredChunksSource).toContain('"run-detail-workspace-blocking-banner"');
    expect(deferredChunksSource).toContain('"run-detail-workspace-sticky-actions"');
    expect(deferredChunksSource).toContain('"run-detail-section-nav"');
    expect(deferredChunksSource).toContain('"run-detail-outcome-cards"');
    expect(deferredChunksSource).toContain('"run-detail-artifacts-exports-section"');
    expect(deferredChunksSource).toContain('"run-detail-operator-technical-forensics"');
    expect(deferredChunksSource).toContain('"run-detail-sponsor-bottom-line"');
    expect(deferredChunksSource).toContain('"run-detail-review-package-do-this-next-resolved"');
    expect(deferredChunksSource).toContain('"run-detail-review-package-sponsor-handoff-gate"');
    expect(deferredChunksSource).toContain('"run-detail-help-page-situation-registrar"');
    expect(deferredChunksSource).toContain('"run-detail-review-generation-created-notice"');
    expect(deferredChunksSource).toContain('"run-detail-progress-tracker"');
    expect(deferredChunksSource).toContain('"run-detail-estimated-llm-cost-card"');
    expect(deferredChunksSource).toContain('"run-detail-capture-evidence-section"');
    expect(deferredChunksSource).toContain('"run-detail-manifest-summary-section"');
    expect(deferredChunksSource).toContain('"run-detail-agent-results-summary-card"');
    expect(deferredChunksSource).toContain('"run-detail-review-agent-execution-log-section"');
    expect(deferredChunksSource).toContain('"run-detail-retrieval-grounding-summary-card"');
    expect(deferredChunksSource).toContain('"run-detail-run-metadata-section"');
    expect(deferredChunksSource).toContain('"run-detail-last-failure-card"');
    expect(deferredChunksSource).toContain('"run-detail-trust-evidence-card-section"');
    expect(deferredChunksSource).toContain('"run-detail-sample-review-package-summary"');
    expect(deferredChunksSource).toContain('"run-detail-architecture-create-work-item-section"');
    expect(deferredChunksSource).toContain('"run-detail-architecture-sponsor-sharing-panel"');
    expect(deferredChunksSource).toContain('"run-detail-first-week-route-guidance"');
    expect(deferredChunksSource).toContain('"run-detail-cold-open-orientation"');
    expect(deferredChunksSource).toContain('"run-detail-explanation-confidence-banner"');
    expect(manifestLoaderSource).toContain('import("@/components/reviews/ReviewWorkspaceShell")');
    expect(manifestLoaderSource).toContain('import("@/components/reviews/RunDetailOverviewPanelClient")');
    expect(manifestLoaderSource).toContain('import("@/components/architecture/ArchitectureCreatedReviewWorkspaceShell")');
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailEvidenceTabPanel")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailBelowFoldSections")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCreateHomeEvidencePanel")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCreateHomeActivityPanel")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/components/reviews/technology-baseline/TechnologyBaselineSection")',
    );
    expect(manifestLoaderSource).toContain('import("@/components/ChangesSinceLastReviewBanner")');
    expect(manifestLoaderSource).toContain('import("@/components/RunSavingsSummary")');
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailDecisionDeltaPanel")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailRunExplanationCollapsible")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailActivitySourcesPanel")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceChrome")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceSummaryStripTabAware")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceStickyActions")',
    );
    expect(manifestLoaderSource).toContain('import("@/components/runs/RunDetailSectionNav")');
    expect(manifestLoaderSource).toContain('import("@/components/runs/RunDetailOutcomeCards")');
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailOperatorTechnicalForensicsPanel")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailSponsorBottomLine")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageDoThisNextResolved")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageSponsorHandoffGate")',
    );
    expect(manifestLoaderSource).toContain('import("@/components/help/HelpPageSituationRegistrar")');
    expect(manifestLoaderSource).toContain(
      'import("@/components/review-intake/ReviewGenerationCreatedNotice")',
    );
    expect(manifestLoaderSource).toContain('import("@/components/runs/RunProgressTracker")');
    expect(manifestLoaderSource).toContain('import("@/components/runs/RunEstimatedLlmCostCard")');
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCaptureEvidenceSection")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailManifestSummarySection")',
    );
    expect(manifestLoaderSource).toContain('import("@/components/runs/RunAgentResultsSummaryCard")');
    expect(manifestLoaderSource).toContain('import("@/components/reviews/ReviewAgentExecutionLogSection")');
    expect(manifestLoaderSource).toContain('import("@/components/runs/RunRetrievalGroundingSummaryCard")');
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailRunMetadataSection")',
    );
    expect(manifestLoaderSource).toContain('import("@/components/runs/RunDetailLastFailureCard")');
    expect(manifestLoaderSource).toContain('import("@/components/runs/RunTrustEvidenceCardSection")');
    expect(manifestLoaderSource).toContain('import("@/components/SampleReviewPackageSummary")');
    expect(manifestLoaderSource).toContain('import("@/components/architecture/ArchitectureCreateWorkItemSection")');
    expect(manifestLoaderSource).toContain('import("@/components/architecture/ArchitectureSponsorSharingPanel")');
    expect(manifestLoaderSource).toContain('import("@/components/FirstWeekRouteGuidance")');
    expect(manifestLoaderSource).toContain('import("@/components/reviews/RunDetailColdOpenOrientationClient")');
    expect(manifestLoaderSource).toContain('import("@/components/runs/RunExplanationConfidenceBanner")');
    expect(deferredChunksSource).toContain("RunDetailArchitectureCreateWorkItemSectionDeferred");
    expect(deferredChunksSource).toContain("RunDetailArchitectureSponsorSharingPanelDeferred");
    expect(deferredChunksSource).toContain("RunDetailSampleReviewPackageSummaryDeferred");
    expect(deferredChunksSource).toContain("RunDetailFirstWeekRouteGuidanceDeferred");
    expect(deferredChunksSource).toContain("RunDetailColdOpenOrientationDeferred");
    expect(deferredChunksSource).toContain("RunDetailExplanationConfidenceBannerDeferred");
    expect(deferredChunksSource).not.toContain('import("@/components/SampleReviewPackageSummary")');
    expect(deferredChunksSource).not.toContain('import("@/components/architecture/ArchitectureCreateWorkItemSection")');
    expect(deferredChunksSource).not.toContain('import("@/components/architecture/ArchitectureSponsorSharingPanel")');
    expect(deferredChunksSource).not.toContain('import("@/components/FirstWeekRouteGuidance")');
    expect(deferredChunksSource).not.toContain('import("@/components/reviews/RunDetailColdOpenOrientationClient")');
    expect(deferredChunksSource).not.toContain('import("@/components/runs/RunExplanationConfidenceBanner")');
    expect(deferredChunksSource).toContain("RunDetailArchitectureCreatedWorkspaceDeferred");
    expect(deferredChunksSource).not.toContain('import("@/components/architecture/ArchitectureCreatedWorkspace")');
    expect(deferredChunksSource).toContain("RunDetailProgressTrackerDeferred");
    expect(deferredChunksSource).toContain("RunDetailAgentResultsSummaryCardDeferred");
    expect(deferredChunksSource).toContain("RunDetailReviewAgentExecutionLogSectionDeferred");
    expect(deferredChunksSource).toContain("RunDetailRetrievalGroundingSummaryCardDeferred");
    expect(deferredChunksSource).toContain("RunDetailRunMetadataSectionDeferred");
    expect(deferredChunksSource).toContain("RunDetailLastFailureCardDeferred");
    expect(deferredChunksSource).toContain("RunDetailTrustEvidenceCardSectionDeferred");
    expect(deferredChunksSource).not.toContain('import("@/components/runs/RunAgentResultsSummaryCard")');
    expect(deferredChunksSource).not.toContain('import("@/components/reviews/ReviewAgentExecutionLogSection")');
    expect(deferredChunksSource).not.toContain('import("@/components/runs/RunRetrievalGroundingSummaryCard")');
    expect(deferredChunksSource).not.toContain('import("./RunDetailRunMetadataSection")');
    expect(deferredChunksSource).not.toContain('import("@/components/runs/RunDetailLastFailureCard")');
    expect(deferredChunksSource).not.toContain('import("@/components/runs/RunTrustEvidenceCardSection")');
    expect(deferredChunksSource).toContain("RunDetailOutcomeCardsDeferred");
    expect(deferredChunksSource).toContain("RunDetailWhatIfBranchCompareBannerDeferred");
    expect(deferredChunksSource).toContain("RunDetailOperatorTechnicalForensicsPanelDeferred");
    expect(deferredChunksSource).toContain("RunDetailArtifactsExportsSectionDeferred");
    expect(deferredChunksSource).toContain("ReviewDetailWorkspaceDeferred");
    expect(deferredChunksSource).not.toContain('import("@/components/reviews/ReviewWorkspaceShell")');
    expect(deferredChunksSource).toContain("RunDetailOverviewPanelClientDeferred");
    expect(deferredChunksSource).not.toContain('import("@/components/reviews/RunDetailOverviewPanelClient")');
    expect(deferredChunksSource).toContain("RunDetailWorkspaceHeaderDeferred");
    expect(deferredChunksSource).toContain("RunDetailWorkspaceSummaryStripDeferred");
    expect(deferredChunksSource).toContain("RunDetailWorkspaceBlockingBannerDeferred");
    expect(deferredChunksSource).toContain("ReviewPackageDoThisNextStripDeferred");
    expect(deferredChunksSource).toContain('import("./ReviewPackageDoThisNextStrip")');
    expect(deferredChunksSource).toContain("RunDetailWorkspaceStickyActionsDeferred");
    expect(deferredChunksSource).toContain("ReviewPackagePrimaryActionDeferred");
    expect(deferredChunksSource).toContain("RunDetailSponsorBottomLineDeferred");
    expect(deferredChunksSource).toContain("RunDetailSectionNavDeferred");
    expect(deferredChunksSource).toContain("RunDetailManifestSummarySectionDeferred");
    expect(deferredChunksSource).toContain("RunDetailSubmittedArchitectureSectionDeferred");
    expect(deferredChunksSource).toContain("RunDetailCaptureEvidenceSectionDeferred");
    expect(deferredChunksSource).toContain("RunDetailGovernanceDecisionSectionDeferred");
    expect(deferredChunksSource).toContain("RunDetailReviewPackageSectionDeferred");
    expect(deferredChunksSource).toContain("RunDetailBuyerModeFallbackBannerDeferred");
    expect(deferredChunksSource).not.toContain('import("./RunDetailWorkspaceChrome")');
    expect(deferredChunksSource).not.toContain('import("./RunDetailWorkspaceStickyActions")');
    expect(deferredChunksSource).not.toContain('import("@/components/runs/RunDetailSectionNav")');
    expect(deferredChunksSource).not.toContain(
      'import("./RunDetailWorkspaceSummaryStripTabAware")',
    );
    expect(deferredChunksSource).not.toContain('import("@/components/runs/RunDetailOutcomeCards")');
    expect(deferredChunksSource).not.toContain(
      'import("./RunDetailOperatorTechnicalForensicsPanel")',
    );
    expect(deferredChunksSource).not.toContain('import("./RunDetailArtifactsExportsSection")');
    expect(deferredChunksSource).not.toContain('import("./RunDetailSponsorBottomLine")');
    expect(deferredChunksSource).not.toContain('import("./RunDetailReviewPackageDoThisNextResolved")');
    expect(deferredChunksSource).not.toContain('import("./RunDetailReviewPackageSponsorHandoffGate")');
    expect(deferredChunksSource).not.toContain('import("@/components/help/HelpPageSituationRegistrar")');
    expect(deferredChunksSource).not.toContain(
      'import("@/components/review-intake/ReviewGenerationCreatedNotice")',
    );
    expect(deferredChunksSource).not.toContain('import("@/components/runs/RunProgressTracker")');
    expect(deferredChunksSource).not.toContain('import("@/components/runs/RunEstimatedLlmCostCard")');
    expect(deferredChunksSource).not.toContain('import("./RunDetailCaptureEvidenceSection")');
    expect(deferredChunksSource).not.toContain('import("./RunDetailManifestSummarySection")');
    expect(deferredChunksSource).toContain('import("./ReviewPackagePrimaryActionTabAware")');
    expect(deferredChunksSource).toContain('import("./RunDetailSubmittedArchitectureSection")');
    expect(deferredChunksSource).toContain('import("./RunDetailBuyerPilotConversionSection")');
    expect(deferredChunksSource).toContain('import("./RunDetailExecutiveSummaryCtaCard")');
    expect(deferredChunksSource).toContain('import("./RunDetailGovernanceCta")');
    expect(deferredChunksSource).toContain('import("./RunDetailGovernanceDecisionSection")');
    expect(deferredChunksSource).toContain('import("./RunDetailReviewPackageSection")');
    expect(deferredChunksSource).toContain('import("./RunDetailBuyerModeFallbackBanner")');
    expect(deferredChunksSource).toContain("RunDetailEvidenceTabPanelDeferred");
    expect(deferredChunksSource).not.toContain('import("./RunDetailEvidenceTabPanel")');
    expect(deferredChunksSource).toContain('import("./RunDetailReviewPackageShareRow")');
    expect(deferredChunksSource).toContain('import("./RunDetailDemoMarketingChrome")');
    expect(deferredChunksSource).toContain('import("./RunDetailManifestSummaryAlerts")');
    expect(deferredChunksSource).not.toContain('import("@/components/runs/RunDetailOutcomeCards")');
    expect(deferredChunksSource).not.toContain(
      'import("./RunDetailOperatorTechnicalForensicsPanel")',
    );
    expect(deferredChunksSource).not.toContain('import("./RunDetailArtifactsExportsSection")');
    expect(deferredChunksSource).toContain("RunDetailReviewPackageDoThisNextResolvedDeferred");
    expect(deferredChunksSource).toContain("RunDetailReviewPackageSponsorHandoffGateDeferred");
    expect(deferredChunksSource).not.toContain('import("./RunDetailReviewPackageDoThisNextResolved")');
    expect(deferredChunksSource).not.toContain('import("./RunDetailReviewPackageSponsorHandoffGate")');
    expect(deferredChunksSource).toContain("RunDetailCreateHomeEvidencePanelDeferred");
    expect(deferredChunksSource).toContain("RunDetailCreateHomeActivityPanelDeferred");
    expect(deferredChunksSource).not.toContain('import("./RunDetailCreateHomeEvidencePanel")');
    expect(deferredChunksSource).not.toContain('import("./RunDetailCreateHomeActivityPanel")');
    expect(deferredChunksSource).toContain("RunDetailActivitySourcesPanelDeferred");
    expect(deferredChunksSource).not.toContain('import("./RunDetailActivitySourcesPanel")');
    expect(deferredChunksSource).toContain("GoldenSponsorPackageWalkthroughDestinationDeferred");
    expect(deferredChunksSource).toContain(
      'import("@/components/golden-walkthrough/GoldenSponsorPackageWalkthroughDestination")',
    );
  });

  it("dynamic-imports findings/explanation client leaves (TB-2021)", () => {
    expect(explanationCollapsibleSource).not.toMatch(
      /import\s+\{\s*RunDetailFindingsWorkspace\s*\}\s+from\s+["']\.\/RunDetailFindingsWorkspace["']/,
    );
    expect(explanationCollapsibleSource).not.toMatch(
      /import\s+\{\s*FindingsWhatIfAnalysisPanel\s*\}\s+from/,
    );
    expect(explanationCollapsibleSource).not.toMatch(
      /import\s+\{\s*RunExplanationSection\s*\}\s+from/,
    );
    expect(explanationCollapsibleSource).not.toMatch(
      /import\s+\{\s*RunFindingExplainabilityTable\s*\}\s+from/,
    );
    expect(explanationCollapsibleSource).toContain('import("./RunDetailFindingsWorkspace")');
    expect(explanationCollapsibleSource).toContain(
      'import("@/components/findings/FindingsWhatIfAnalysisPanel")',
    );
    expect(explanationCollapsibleSource).toContain('import("@/components/runs/RunExplanationSection")');
    expect(explanationCollapsibleSource).toContain(
      'import("@/components/runs/RunFindingExplainabilityTable")',
    );
  });

  it("dynamic-imports below-fold habit/authority/grounding islands (TB-2021)", () => {
    expect(belowFoldSource).not.toMatch(
      /import\s+\{\s*PostCommitHabitLoopCard\s*\}\s+from/,
    );
    expect(belowFoldSource).not.toMatch(
      /import\s+\{\s*RecurrenceSchedulePostCommitCard\s*\}\s+from/,
    );
    expect(belowFoldSource).not.toMatch(
      /import\s+\{\s*RunDetailAuthorityChainSection\s*\}\s+from/,
    );
    expect(belowFoldSource).not.toMatch(
      /import\s+\{\s*RunDetailRetrievalGroundingSection\s*\}\s+from/,
    );
    expect(belowFoldSource).not.toContain('./RunDetailArtifactsExportsSection"');
    expect(belowFoldSource).toContain("RunDetailArtifactsExportsSectionDeferred");
    expect(belowFoldSource).toContain('import("@/components/PostCommitHabitLoopCard")');
    expect(belowFoldSource).toContain(
      'import("@/components/governance/RecurrenceSchedulePostCommitCard")',
    );
    expect(belowFoldSource).toContain('import("./RunDetailAuthorityChainSection")');
    expect(belowFoldSource).toContain('import("./RunDetailRetrievalGroundingSection")');
  });

  it("dynamic-imports mid/decision-delta/explanation leaves (wave 10)", () => {
    expect(midDeferredSource).not.toContain('@/components/ChangesSinceLastReviewBanner"');
    expect(midDeferredSource).not.toContain('@/components/RunSavingsSummary"');
    expect(midDeferredSource).toContain("ChangesSinceLastReviewBannerDeferred");
    expect(midDeferredSource).toContain("RunSavingsSummaryDeferred");
    expect(midDeferredSource).toContain("run-detail-page-view-deferred-chunks");

    expect(decisionDeltaDeferredSource).not.toContain('./RunDetailDecisionDeltaPanel"');
    expect(decisionDeltaDeferredSource).toContain("RunDetailDecisionDeltaPanelDeferred");
    expect(decisionDeltaDeferredSource).toContain("run-detail-page-view-deferred-chunks");

    expect(explanationDeferredSource).not.toContain('./RunDetailRunExplanationCollapsible"');
    expect(explanationDeferredSource).toContain("RunDetailRunExplanationCollapsibleDeferred");
    expect(explanationDeferredSource).toContain("run-detail-page-view-deferred-chunks");

    expect(deferredChunksSource).toContain("ChangesSinceLastReviewBannerDeferred");
    expect(deferredChunksSource).toContain("RunSavingsSummaryDeferred");
    expect(deferredChunksSource).toContain("RunDetailDecisionDeltaPanelDeferred");
    expect(deferredChunksSource).toContain("RunDetailRunExplanationCollapsibleDeferred");
    expect(deferredChunksSource).not.toContain('import("@/components/ChangesSinceLastReviewBanner")');
    expect(deferredChunksSource).not.toContain('import("@/components/RunSavingsSummary")');
    expect(deferredChunksSource).not.toContain('import("./RunDetailDecisionDeltaPanel")');
    expect(deferredChunksSource).not.toContain('import("./RunDetailRunExplanationCollapsible")');
  });

  it("splits below-fold into nested Suspense boundaries (TB-2026)", () => {
    expect(belowFoldSource).toContain("RunDetailBelowFoldPipelineAsync");
    expect(belowFoldSource).toContain("RunDetailBelowFoldProjectContextAsync");
    expect(belowFoldSource).toContain("RunDetailBelowFoldPipelineSkeleton");
    expect(belowFoldSource).toContain("RunDetailBelowFoldProjectContextSkeleton");
    expect(belowFoldSource).toMatch(/export function RunDetailBelowFoldSections/);
    expect(belowFoldSource).not.toContain("loadRunDetailBelowFoldDeferredModel");
  });
});
