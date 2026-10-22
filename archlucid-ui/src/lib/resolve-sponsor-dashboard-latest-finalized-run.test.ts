import { describe, expect, it } from "vitest";

import { resolveSponsorDashboardLatestFinalizedRunId } from "@/lib/resolve-sponsor-dashboard-latest-finalized-run";
import type { SponsorRoiSummary } from "@/lib/sponsor/sponsor-summary-markdown";

function summary(overrides: Partial<SponsorRoiSummary> = {}): SponsorRoiSummary {
  return {
    totalEstimatedUsdSavings: 0,
    systemCount: 1,
    latestRunCount: 1,
    eaDiscountMultiplier: 1,
    savingsPricingBasis: "illustrative",
    systems: [],
    topSystemicIssues: [],
    ...overrides,
  };
}

describe("resolveSponsorDashboardLatestFinalizedRunId", () => {
  it("returns the most recently committed run id", () => {
    const runId = resolveSponsorDashboardLatestFinalizedRunId(
      summary({
        systems: [
          {
            systemName: "Older",
            runId: "run-old",
            committedUtc: "2025-01-01T00:00:00Z",
            estimatedUsdSavings: 1,
          },
          {
            systemName: "Newer",
            runId: "run-new",
            committedUtc: "2026-02-01T00:00:00Z",
            estimatedUsdSavings: 2,
          },
        ],
      }),
    );

    expect(runId).toBe("run-new");
  });
});
