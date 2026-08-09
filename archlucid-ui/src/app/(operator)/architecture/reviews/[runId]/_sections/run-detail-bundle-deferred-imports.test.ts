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

const explanationCollapsibleSource = readFileSync(
  join(sectionsDir, "RunDetailRunExplanationCollapsible.tsx"),
  "utf8",
);

const belowFoldSource = readFileSync(join(sectionsDir, "RunDetailBelowFoldSections.tsx"), "utf8");

const bannedStaticImports = [
  '@/components/RunEstimatedLlmCostCard"',
  '@/components/RunAgentResultsSummaryCard"',
  '@/components/reviews/ReviewAgentExecutionLogSection"',
  '@/components/RunRetrievalGroundingSummaryCard"',
  '@/components/RunProgressTracker"',
  '@/components/RunTrustEvidenceCardSection"',
  '@/components/SampleReviewPackageSummary"',
  '@/components/architecture/ArchitectureCreatedWorkspace"',
  '@/components/architecture/ArchitectureCreateWorkItemSection"',
  '@/components/architecture/ArchitectureSponsorSharingPanel"',
  '@/components/FirstWeekRouteGuidance"',
  '@/components/RunExplanationConfidenceBanner"',
  '@/components/reviews/RunDetailGovernanceAlerts"',
  '@/components/RunDetailOutcomeCards"',
  '@/components/draft-intake/WhatIfBranchCompareBanner"',
  '@/components/usability/CommitBlockingFindingsBanner"',
  '@/components/usability/StalledReviewGuidanceCallout"',
  '@/components/cto-demo/CtoDemoReviewRouteGuard"',
  '@/components/findings/ReviewDetailPolicyPackImpactCallout"',
  '@/components/RunDetailLastFailureCard"',
  '@/components/reviews/ReviewDetailWorkspace"',
  '@/components/reviews/RunDetailOverviewPanelClient"',
  '@/components/RunDetailSectionNav"',
  './RunDetailOperatorTechnicalForensicsPanel"',
  './RunDetailArtifactsExportsSection"',
  './RunDetailWorkspaceChrome"',
  './RunDetailWorkspaceStickyActions"',
  './ReviewPackagePrimaryAction"',
  './RunDetailExecutiveBottomLine"',
  './RunDetailManifestSummarySection"',
  './RunDetailSubmittedArchitectureSection"',
  './RunDetailCaptureEvidenceSection"',
  './RunDetailBuyerPilotConversionSection"',
  './RunDetailBuyerModeFallbackBanner"',
  './RunDetailExecutiveSummaryCtaCard"',
  './RunDetailGovernanceDecisionSection"',
  './RunDetailReviewPackageSection"',
  './RunDetailGovernanceCta"',
] as const;

describe("run detail bundle deferred imports (TB-697 / TB-933 / TB-2021 / TB-2117)", () => {
  it("keeps heavy review-detail modules off the page view static import graph", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(pageViewSource).not.toContain(bannedImport);
    }

    expect(pageViewSource).toContain("RunDetailWorkspaceHeaderDeferred");
    expect(pageViewSource).toContain("RunDetailWorkspaceSummaryStripDeferred");
    expect(pageViewSource).toContain("RunDetailWorkspaceBlockingBannerDeferred");
    expect(pageViewSource).toContain("RunDetailWorkspaceStickyActionsDeferred");
    expect(pageViewSource).toContain("ReviewPackagePrimaryActionDeferred");
    expect(pageViewSource).toContain("RunDetailExecutiveBottomLineDeferred");
    expect(pageViewSource).toContain("RunDetailSectionNavDeferred");
    expect(pageViewSource).toContain("RunDetailTabbedSectionNavDeferred");
    expect(pageViewSource).toContain("RunDetailManifestSummarySectionDeferred");
    expect(pageViewSource).toContain("RunDetailSubmittedArchitectureSectionDeferred");
    expect(pageViewSource).toContain("RunDetailCaptureEvidenceSectionDeferred");
    expect(pageViewSource).toContain("RunDetailBuyerPilotConversionSectionDeferred");
    expect(pageViewSource).toContain("RunDetailExecutiveSummaryCtaCardDeferred");
    expect(pageViewSource).toContain("RunDetailGovernanceDecisionSectionDeferred");
    expect(pageViewSource).toContain("RunDetailReviewPackageSectionDeferred");
    expect(pageViewSource).toContain("RunDetailBuyerModeFallbackBannerDeferred");
    expect(pageViewSource).toContain("RunDetailGovernanceCtaDeferred");
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
    expect(deferredChunksSource).toContain("RunDetailArchitectureCreatedWorkspaceDeferred");
    expect(deferredChunksSource).toContain("RunDetailArchitectureCreateWorkItemSectionDeferred");
    expect(deferredChunksSource).toContain("RunDetailArchitectureSponsorSharingPanelDeferred");
    expect(deferredChunksSource).toContain("RunDetailProgressTrackerDeferred");
    expect(deferredChunksSource).toContain("RunDetailOutcomeCardsDeferred");
    expect(deferredChunksSource).toContain("RunDetailWhatIfBranchCompareBannerDeferred");
    expect(deferredChunksSource).toContain("RunDetailOperatorTechnicalForensicsPanelDeferred");
    expect(deferredChunksSource).toContain("RunDetailArtifactsExportsSectionDeferred");
    expect(deferredChunksSource).toContain("ReviewDetailWorkspaceDeferred");
    expect(deferredChunksSource).toContain("RunDetailOverviewPanelClientDeferred");
    expect(deferredChunksSource).toContain("RunDetailWorkspaceHeaderDeferred");
    expect(deferredChunksSource).toContain("RunDetailWorkspaceSummaryStripDeferred");
    expect(deferredChunksSource).toContain("RunDetailWorkspaceBlockingBannerDeferred");
    expect(deferredChunksSource).toContain("RunDetailWorkspaceStickyActionsDeferred");
    expect(deferredChunksSource).toContain("ReviewPackagePrimaryActionDeferred");
    expect(deferredChunksSource).toContain("RunDetailExecutiveBottomLineDeferred");
    expect(deferredChunksSource).toContain("RunDetailSectionNavDeferred");
    expect(deferredChunksSource).toContain("RunDetailManifestSummarySectionDeferred");
    expect(deferredChunksSource).toContain("RunDetailSubmittedArchitectureSectionDeferred");
    expect(deferredChunksSource).toContain("RunDetailCaptureEvidenceSectionDeferred");
    expect(deferredChunksSource).toContain("RunDetailGovernanceDecisionSectionDeferred");
    expect(deferredChunksSource).toContain("RunDetailReviewPackageSectionDeferred");
    expect(deferredChunksSource).toContain("RunDetailBuyerModeFallbackBannerDeferred");
    expect(deferredChunksSource).toContain('import("./RunDetailWorkspaceChrome")');
    expect(deferredChunksSource).toContain('import("./RunDetailWorkspaceStickyActions")');
    expect(deferredChunksSource).toContain('import("./ReviewPackagePrimaryActionTabAware")');
    expect(deferredChunksSource).toContain('import("./RunDetailExecutiveBottomLine")');
    expect(deferredChunksSource).toContain('import("@/components/RunDetailSectionNav")');
    expect(deferredChunksSource).toContain('import("./RunDetailManifestSummarySection")');
    expect(deferredChunksSource).toContain('import("./RunDetailSubmittedArchitectureSection")');
    expect(deferredChunksSource).toContain('import("./RunDetailCaptureEvidenceSection")');
    expect(deferredChunksSource).toContain('import("./RunDetailBuyerPilotConversionSection")');
    expect(deferredChunksSource).toContain('import("./RunDetailExecutiveSummaryCtaCard")');
    expect(deferredChunksSource).toContain('import("./RunDetailGovernanceCta")');
    expect(deferredChunksSource).toContain('import("./RunDetailGovernanceDecisionSection")');
    expect(deferredChunksSource).toContain('import("./RunDetailReviewPackageSection")');
    expect(deferredChunksSource).toContain('import("./RunDetailBuyerModeFallbackBanner")');
    expect(deferredChunksSource).toContain('import("@/components/RunEstimatedLlmCostCard")');
    expect(deferredChunksSource).toContain('import("@/components/RunDetailOutcomeCards")');
    expect(deferredChunksSource).toContain(
      'import("@/components/architecture/ArchitectureCreateWorkItemSection")',
    );
    expect(deferredChunksSource).toContain(
      'import("@/components/architecture/ArchitectureSponsorSharingPanel")',
    );
    expect(deferredChunksSource).toContain(
      'import("./RunDetailOperatorTechnicalForensicsPanel")',
    );
    expect(deferredChunksSource).toContain('import("./RunDetailArtifactsExportsSection")');
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
      'import("@/components/FindingsWhatIfAnalysisPanel")',
    );
    expect(explanationCollapsibleSource).toContain('import("@/components/RunExplanationSection")');
    expect(explanationCollapsibleSource).toContain(
      'import("@/components/RunFindingExplainabilityTable")',
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

  it("splits below-fold into nested Suspense boundaries (TB-2026)", () => {
    expect(belowFoldSource).toContain("RunDetailBelowFoldPipelineAsync");
    expect(belowFoldSource).toContain("RunDetailBelowFoldProjectContextAsync");
    expect(belowFoldSource).toContain("RunDetailBelowFoldPipelineSkeleton");
    expect(belowFoldSource).toContain("RunDetailBelowFoldProjectContextSkeleton");
    expect(belowFoldSource).toMatch(/export function RunDetailBelowFoldSections/);
    expect(belowFoldSource).not.toContain("loadRunDetailBelowFoldDeferredModel");
  });
});
