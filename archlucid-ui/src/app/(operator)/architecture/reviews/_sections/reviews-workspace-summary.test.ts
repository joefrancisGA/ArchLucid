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
      findingsTotalOmitted: false,
      openRisksTotalOmitted: false,
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

  it("excludes showcase sample rows from live tenant totals", () => {
    const summary = deriveReviewsWorkspaceSummary([
      run({ runId: SHOWCASE_STATIC_DEMO_RUN_ID, hasGoldenManifest: true, hasFindingsSnapshot: true }),
      run({ runId: "live-in-flight", hasFindingsSnapshot: true, findingCount: 2 }),
    ]);

    expect(summary.inProgress).toBe(1);
    expect(summary.committed).toBe(0);
    expect(summary.findings).toBe(2);
    expect(summary.openRisks).toBe(0);
  });
  it("does not mark open risks omitted when warning count and warning flags are absent", () => {
    const summary = deriveReviewsWorkspaceSummary([
      run({ runId: "live-in-flight", hasFindingsSnapshot: true, findingCount: 2 }),
    ]);

    expect(summary.openRisks).toBe(0);
    expect(summary.openRisksTotalOmitted).toBe(false);
  });

  it("marks open risks omitted when a review flags warnings without a stored count", () => {
    const summary = deriveReviewsWorkspaceSummary([
      run({ runId: "flagged", hasFindingsSnapshot: true, findingCount: 1, hasWarnings: true }),
    ]);

    expect(summary.openRisks).toBe(0);
    expect(summary.openRisksTotalOmitted).toBe(true);
  });
  it("does not mark findings omitted for a draft that has not stored a findings snapshot", () => {
    const summary = deriveReviewsWorkspaceSummary([
      run({
        runId: "draft",
        hasGoldenManifest: false,
        hasFindingsSnapshot: false,
      }),
    ]);

    expect(summary.findings).toBe(0);
    expect(summary.findingsTotalOmitted).toBe(false);
    expect(summary.inProgress).toBe(1);
  });

  it("marks findings omitted when a finalized review has no stored finding count", () => {
    const summary = deriveReviewsWorkspaceSummary([
      run({ runId: "finalized", hasGoldenManifest: true }),
    ]);

    expect(summary.findings).toBe(0);
    expect(summary.findingsTotalOmitted).toBe(true);
  });
});
