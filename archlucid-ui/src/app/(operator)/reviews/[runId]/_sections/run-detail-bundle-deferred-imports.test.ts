import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const pageViewSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailPageView.tsx"),
  "utf8",
);

const deferredChunksSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "run-detail-page-view-deferred-chunks.tsx"),
  "utf8",
);

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
  './RunDetailOperatorTechnicalForensicsPanel"',
] as const;

describe("run detail bundle deferred imports (TB-697 / TB-933)", () => {
  it("keeps heavy review-detail modules off the page view static import graph", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(pageViewSource).not.toContain(bannedImport);
    }

    expect(pageViewSource).toContain("RunDetailOperatorTechnicalForensicsPanelDeferred");
    expect(pageViewSource).toContain("RunDetailOutcomeCardsDeferred");
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
  });
});
