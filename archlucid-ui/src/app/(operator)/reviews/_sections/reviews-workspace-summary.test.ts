import { describe, expect, it } from "vitest";

import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

import { deriveReviewsWorkspaceSummary } from "./reviews-workspace-summary";

function run(overrides: Partial<RunSummary> & Pick<RunSummary, "runId">): RunSummary {
  return {
    projectId: "default",
    createdUtc: "2026-01-14T12:00:00.000Z",
    ...overrides,
  };
}

describe("deriveReviewsWorkspaceSummary", () => {
  it("returns zeros for an empty workspace", () => {
    expect(deriveReviewsWorkspaceSummary([])).toEqual({
      inProgress: 0,
      committed: 0,
      findings: 0,
      openRisks: 0,
      readyForGovernance: 0,
    });
  });

  it("counts in-progress and committed packages with findings and risks", () => {
    const summary = deriveReviewsWorkspaceSummary([
      run({ runId: "in-flight", hasFindingsSnapshot: true, findingCount: 3, warningCount: 1 }),
      run({ runId: "done", hasGoldenManifest: true, findingCount: 9, warningCount: 1 }),
    ]);

    expect(summary.inProgress).toBe(1);
    expect(summary.committed).toBe(1);
    expect(summary.findings).toBe(12);
    expect(summary.openRisks).toBe(2);
    expect(summary.readyForGovernance).toBe(1);
  });

  it("uses showcase spine counts for the sample package when wire counts are absent", () => {
    const summary = deriveReviewsWorkspaceSummary([
      run({ runId: SHOWCASE_STATIC_DEMO_RUN_ID, hasGoldenManifest: true, hasFindingsSnapshot: true }),
    ]);

    expect(summary.committed).toBe(1);
    expect(summary.findings).toBeGreaterThan(0);
    expect(summary.openRisks).toBeGreaterThan(0);
  });
});
