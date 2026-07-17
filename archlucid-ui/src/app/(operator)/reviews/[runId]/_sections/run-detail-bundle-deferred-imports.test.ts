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
  '@/components/FirstWeekRouteGuidance"',
  '@/components/RunExplanationConfidenceBanner"',
  '@/components/reviews/RunDetailGovernanceAlerts"',
] as const;

describe("run detail bundle deferred imports (TB-697)", () => {
  it("keeps heavy review-detail modules off the page view static import graph", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(pageViewSource).not.toContain(bannedImport);
    }

    expect(pageViewSource).toContain("RunDetailOperatorTechnicalForensicsPanel");
    expect(pageViewSource).toContain("run-detail-page-view-deferred-chunks");
  });

  it("dynamic-imports operator forensics and activity-tab chunks", () => {
    expect(deferredChunksSource).toContain("RunDetailEstimatedLlmCostCardDeferred");
    expect(deferredChunksSource).toContain("RunDetailArchitectureCreatedWorkspaceDeferred");
    expect(deferredChunksSource).toContain("RunDetailProgressTrackerDeferred");
    expect(deferredChunksSource).toContain('import("@/components/RunEstimatedLlmCostCard")');
  });
});
