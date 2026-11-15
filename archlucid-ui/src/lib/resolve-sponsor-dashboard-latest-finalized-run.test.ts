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

  it("selects the true latest finalization when timestamps share a second", () => {
    const runId = resolveSponsorDashboardLatestFinalizedRunId(summary({
      systems: [
        { systemName: "Older", runId: "run-old", committedUtc: "2026-02-01T00:00:00Z", estimatedUsdSavings: 1 },
        { systemName: "Newer", runId: "run-new", committedUtc: "2026-02-01T00:00:00.5Z", estimatedUsdSavings: 2 },
      ],
    }));

    expect(runId).toBe("run-new");
  });

  it("finds the newest linkable finalized review when some rows lack a time or ID", () => {
    const runId = resolveSponsorDashboardLatestFinalizedRunId(summary({
      systems: [
        { systemName: "Undated", runId: "run-undated", committedUtc: null, estimatedUsdSavings: 1 },
        { systemName: "Missing ID", runId: " ", committedUtc: "2026-03-01T00:00:00Z", estimatedUsdSavings: 2 },
        { systemName: "Linkable", runId: "run-linkable", committedUtc: "2026-02-01T00:00:00Z", estimatedUsdSavings: 2 },
      ],
    }));

    expect(runId).toBe("run-linkable");
  });
});
