import { describe, expect, it } from "vitest";

import {
  deriveOperatorHomeWorkspaceMetrics,
  formatSetupReadinessCompleteLabel,
  formatSetupReadinessLabel,
} from "@/lib/operator/operator-home-workspace-metrics";
import type { RunSummary } from "@/types/authority";

function makeRun(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    runId: "11111111-1111-1111-1111-111111111111",
    projectId: "default",
    createdUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("deriveOperatorHomeWorkspaceMetrics", () => {
  it("returns zeroed metrics for an empty workspace", () => {
    const metrics = deriveOperatorHomeWorkspaceMetrics([], 0);

    expect(metrics).toEqual({
      reviewPackagesTotal: 0,
      reviewPackagesCommitted: 0,
      reviewPackagesActive: 0,
      openFindings: 0,
      governanceWarnings: 0,
      evidenceSources: 0,
      hasReviews: false,
    });
  });

  it("does not treat a paginated runs page as workspace-wide open findings total", () => {
    const items: RunSummary[] = [
      makeRun({
        runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        hasFindingsSnapshot: true,
        findingCount: 2,
      }),
    ];

    const metrics = deriveOperatorHomeWorkspaceMetrics(items, 10);

    expect(metrics.reviewPackagesTotal).toBe(10);
    expect(metrics.hasReviews).toBe(true);
    expect(metrics.openFindings).toBe(0);
    expect(metrics.reviewPackagesCommitted).toBe(0);
    expect(metrics.reviewPackagesActive).toBe(0);
  });

  it("aggregates committed, active, findings, warnings, and evidence from runs", () => {
    const items: RunSummary[] = [
      makeRun({
        runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        hasGoldenManifest: true,
        findingCount: 3,
        hasGovernanceWarnings: true,
        hasContextSnapshot: true,
      }),
      makeRun({
        runId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        hasFindingsSnapshot: true,
        findingCount: 2,
        hasGraphSnapshot: true,
      }),
    ];

    const metrics = deriveOperatorHomeWorkspaceMetrics(items, 2);

    expect(metrics.reviewPackagesTotal).toBe(2);
    expect(metrics.reviewPackagesCommitted).toBe(1);
    expect(metrics.reviewPackagesActive).toBe(1);
    expect(metrics.openFindings).toBe(5);
    expect(metrics.governanceWarnings).toBe(1);
    expect(metrics.evidenceSources).toBe(2);
    expect(metrics.hasReviews).toBe(true);
  });
});

describe("formatSetupReadinessLabel", () => {
  it("formats ready counts", () => {
    expect(formatSetupReadinessLabel(2, 4)).toBe("2 of 4 ready");
  });
});

describe("formatSetupReadinessCompleteLabel", () => {
  it("formats complete counts for Continue setup status copy", () => {
    expect(formatSetupReadinessCompleteLabel(2, 4)).toBe("2 of 4 complete");
  });
});
