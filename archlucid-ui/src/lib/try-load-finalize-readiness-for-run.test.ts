import { describe, expect, it, vi } from "vitest";

import { getFinalizeReadiness } from "@/lib/api/finalize-readiness";
import { tryLoadFinalizeReadinessForRun } from "@/lib/try-load-finalize-readiness-for-run";

vi.mock("@/lib/api/finalize-readiness", () => ({
  getFinalizeReadiness: vi.fn(),
}));

vi.mock("@/lib/operator-static-demo/run-scoped-live-api", () => ({
  shouldSkipLiveAuthorityRunScopedApi: vi.fn(() => false),
}));

describe("tryLoadFinalizeReadinessForRun", () => {
  it("returns null when the API call fails", async () => {
    vi.mocked(getFinalizeReadiness).mockRejectedValue(new Error("network"));

    await expect(tryLoadFinalizeReadinessForRun("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")).resolves.toBeNull();
  });

  it("returns readiness payload on success", async () => {
    vi.mocked(getFinalizeReadiness).mockResolvedValue({
      runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      readyToFinalize: false,
      blockedReasonSummary: "Finalize blocked.",
      blocks: [],
      checklist: {
        runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        readyToFinalize: true,
        items: [],
        advisoryCount: 0,
        blockingCount: 0,
        preCommitGateEnabled: true,
      },
      scorecard: {
        blockingFindingCount: 1,
        uncoveredMandatoryRequirementCount: 0,
        openDeferredCount: 0,
        openContradictionCount: 0,
        openCannotDetermineCount: 0,
        openVerifyHypothesisCount: 0,
        unverifiedAssumptionCount: 0,
        lowExtractionConfidenceCount: 0,
        unresolvedHighSeverityDispositionCount: 0,
      },
      scorecardBlockingReasons: ["Finalize blocked."],
      finalizeQualityGateEnabled: true,
    });

    const result = await tryLoadFinalizeReadinessForRun("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    expect(result?.blockedReasonSummary).toBe("Finalize blocked.");
  });
});
