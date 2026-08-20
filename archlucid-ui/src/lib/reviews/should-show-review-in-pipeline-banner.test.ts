import { describe, expect, it } from "vitest";

import { shouldShowReviewInPipelineBanner } from "@/lib/reviews/should-show-review-in-pipeline-banner";
import type { RunSummary } from "@/types/authority";

const baseSummary: RunSummary = {
  runId: "run-1",
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00.000Z",
};

describe("shouldShowReviewInPipelineBanner (TB-2385)", () => {
  it("returns true when pipeline stages remain", () => {
    expect(shouldShowReviewInPipelineBanner(null)).toBe(true);
    expect(shouldShowReviewInPipelineBanner(baseSummary)).toBe(true);
    expect(
      shouldShowReviewInPipelineBanner({
        ...baseSummary,
        hasContextSnapshot: true,
        hasGraphSnapshot: true,
        hasFindingsSnapshot: false,
      }),
    ).toBe(true);
  });

  it("returns false when golden manifest exists on summary", () => {
    expect(
      shouldShowReviewInPipelineBanner({
        ...baseSummary,
        hasContextSnapshot: true,
        hasGraphSnapshot: true,
        hasFindingsSnapshot: true,
        hasGoldenManifest: true,
      }),
    ).toBe(false);
  });
});
