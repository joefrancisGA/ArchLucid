import { describe, expect, it } from "vitest";

import { deriveRunDetailProgressState } from "./derive-run-detail-progress-state";
import { resolveReviewPackagePipelineInFlight } from "./resolve-review-package-pipeline-in-flight";

describe("resolveReviewPackagePipelineInFlight", () => {
  it("stays in flight when progress tracker is on even if goldenManifestId is already on the run", () => {
    const run = {
      runId: "run-partial-golden",
      createdUtc: "2026-08-01T12:00:00Z",
      completedUtc: null,
      legacyRunStatus: "Running",
      goldenManifestId: "manifest-early",
      description: "Partial pipeline",
    };
    const progress = {
      runId: run.runId,
      description: run.description,
      hasContextSnapshot: true,
      hasGraphSnapshot: true,
      hasFindingsSnapshot: true,
      hasGoldenManifest: false,
    };

    const { showProgressTracker } = deriveRunDetailProgressState(run, run.goldenManifestId, progress);

    expect(showProgressTracker).toBe(true);
    expect(resolveReviewPackagePipelineInFlight(showProgressTracker)).toBe(true);
    expect(showProgressTracker && !run.goldenManifestId).toBe(false);
  });
});
