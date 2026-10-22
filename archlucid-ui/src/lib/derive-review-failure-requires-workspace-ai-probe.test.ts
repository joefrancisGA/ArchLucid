import { describe, expect, it } from "vitest";

import { deriveReviewFailureRequiresWorkspaceAiProbe } from "./derive-review-failure-requires-workspace-ai-probe";

describe("deriveReviewFailureRequiresWorkspaceAiProbe", () => {
  it("returns true for pre-stage infrastructure failures", () => {
    expect(
      deriveReviewFailureRequiresWorkspaceAiProbe({
        legacyRunStatus: "Failed",
        pipelineSummary: {
          hasContextSnapshot: false,
          hasGraphSnapshot: false,
          hasFindingsSnapshot: false,
          hasGoldenManifest: false,
        },
      }),
    ).toBe(true);
  });

  it("returns false when the review progressed past the first stage", () => {
    expect(
      deriveReviewFailureRequiresWorkspaceAiProbe({
        legacyRunStatus: "Failed",
        pipelineSummary: {
          hasContextSnapshot: true,
          hasGraphSnapshot: true,
          hasFindingsSnapshot: false,
          hasGoldenManifest: false,
        },
      }),
    ).toBe(false);
  });
});
