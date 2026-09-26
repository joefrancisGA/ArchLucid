import { describe, expect, it } from "vitest";

import { deriveRunDetailProgressState } from "./derive-run-detail-progress-state";

describe("deriveRunDetailProgressState", () => {
  it("treats legacy Completed runs without completedUtc as finished (not in-progress)", () => {
    const run = {
      runId: "run-legacy-complete",
      createdUtc: "2026-08-01T12:00:00Z",
      completedUtc: null,
      legacyRunStatus: "Completed",
      description: "Legacy completed review",
    };

    const { runCompleted, showProgressTracker } = deriveRunDetailProgressState(
      run,
      null,
      { runId: run.runId, description: run.description },
    );

    expect(runCompleted).toBe(true);
    expect(showProgressTracker).toBe(false);
  });

  it("shows progress tracker for in-flight runs without completion signals", () => {
    const run = {
      runId: "run-in-flight",
      createdUtc: "2026-08-01T12:00:00Z",
      completedUtc: null,
      legacyRunStatus: "Running",
      description: "In-flight review",
    };

    const { runCompleted, showProgressTracker } = deriveRunDetailProgressState(
      run,
      null,
      { runId: run.runId, description: run.description },
    );

    expect(runCompleted).toBe(false);
    expect(showProgressTracker).toBe(true);
  });
});
