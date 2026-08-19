import { describe, expect, it } from "vitest";

import {
  analysisStagesCompleteOnSummary,
  pipelineCompleteOnSummary,
} from "./pipeline-complete-on-summary";

describe("pipeline-complete-on-summary", () => {
  it("detects analysis stages complete without sealed review record", () => {
    expect(
      analysisStagesCompleteOnSummary({
        runId: "r1",
        projectId: "p1",
        createdUtc: "2026-01-01T00:00:00.000Z",
        hasContextSnapshot: true,
        hasGraphSnapshot: true,
        hasFindingsSnapshot: true,
        hasGoldenManifest: false,
      }),
    ).toBe(true);

    expect(
      pipelineCompleteOnSummary({
        runId: "r1",
        projectId: "p1",
        createdUtc: "2026-01-01T00:00:00.000Z",
        hasContextSnapshot: true,
        hasGraphSnapshot: true,
        hasFindingsSnapshot: true,
        hasGoldenManifest: false,
      }),
    ).toBe(false);
  });
});
