import { describe, expect, it } from "vitest";

import { isReviewPipelineTerminalFailure } from "@/lib/review-pipeline-terminal-state";

describe("isReviewPipelineTerminalFailure", () => {
  it("returns true for execution failure statuses", () => {
    expect(isReviewPipelineTerminalFailure({ legacyRunStatus: "Failed" })).toBe(true);
    expect(isReviewPipelineTerminalFailure({ legacyRunStatus: "FailedPartial" })).toBe(true);
    expect(isReviewPipelineTerminalFailure({ legacyRunStatus: "PartiallyCompleted" })).toBe(true);
  });

  it("returns true for dead-lettered and quality-rejected runs", () => {
    expect(isReviewPipelineTerminalFailure({ isDeadLettered: true })).toBe(true);
    expect(
      isReviewPipelineTerminalFailure({ legacyRunStatus: "ExecutionCompletedQualityRejected" }),
    ).toBe(true);
  });

  it("returns false for in-progress or successful statuses", () => {
    expect(isReviewPipelineTerminalFailure({ legacyRunStatus: "Created" })).toBe(false);
    expect(isReviewPipelineTerminalFailure({ legacyRunStatus: "Completed" })).toBe(false);
    expect(isReviewPipelineTerminalFailure(null)).toBe(false);
  });
});
