import { describe, expect, it } from "vitest";

import {
  deriveOperatorHomeWorkspaceMetrics,
  deriveOperatorHomeWorkspaceMetricsFromOverviewRuns,
  formatOperatorHomeCompactMetricsLine,
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

describe("deriveOperatorHomeWorkspaceMetricsFromOverviewRuns", () => {
  it("treats non-finite reportedTotalCount as stale when overview rows are loaded on the page", () => {
    const metrics = deriveOperatorHomeWorkspaceMetricsFromOverviewRuns(
      [
        makeRun({ runId: "tenant-a", hasFindingsSnapshot: true }),
        makeRun({ runId: "tenant-b", hasFindingsSnapshot: true }),
      ],
      Number.NaN,
    );

    expect(metrics.reviewPackagesTotal).toBe(2);
    expect(metrics.hasReviews).toBe(true);
  });

  it("uplifts review totals from visible tenant rows when reportedTotalCount is omitted", () => {
    const metrics = deriveOperatorHomeWorkspaceMetricsFromOverviewRuns([
      makeRun({ runId: "tenant-a", hasFindingsSnapshot: true }),
      makeRun({ runId: "tenant-b", hasFindingsSnapshot: true }),
    ]);

    expect(metrics.reviewPackagesTotal).toBe(2);
    expect(metrics.hasReviews).toBe(true);
  });

  it("does not treat demo-only overview rows as tenant reviews when totalCount is zero", () => {
    const metrics = deriveOperatorHomeWorkspaceMetricsFromOverviewRuns(
      [
        {
          runId: "demo-seed",
          projectId: "default",
          demoSeededOverviewInject: true,
          hasGoldenManifest: true,
        },
      ],
      0,
    );

    expect(metrics.reviewPackagesTotal).toBe(0);
    expect(metrics.hasReviews).toBe(false);
  });
});

describe("deriveOperatorHomeWorkspaceMetrics", () => {
  it("ignores description-matched showcase rows when mixed overview items are passed directly (TB-1039)", () => {
    const metrics = deriveOperatorHomeWorkspaceMetrics(
      [
        makeRun({
          runId: "showcase-story",
          description: "Enterprise customer intake modernization review",
          findingCount: 50,
          hasFindingsSnapshot: true,
        }),
        makeRun({
          runId: "tenant-1",
          hasFindingsSnapshot: true,
          findingCount: 2,
        }),
      ],
      2,
    );

    expect(metrics.openFindings).toBe(2);
    expect(metrics.reviewPackagesActive).toBe(1);
    expect(metrics.reviewPackagesTotal).toBe(2);
  });

  it("ignores demo-seeded showcase rows when mixed overview items are passed directly (TB-1039)", () => {
    const metrics = deriveOperatorHomeWorkspaceMetrics(
      [
        makeRun({
          runId: "demo-seed",
          demoSeededOverviewInject: true,
          hasGoldenManifest: true,
          findingCount: 99,
          hasFindingsSnapshot: true,
        }),
        makeRun({
          runId: "tenant-1",
          hasFindingsSnapshot: true,
          findingCount: 1,
        }),
      ],
      1,
    );

    expect(metrics.openFindings).toBe(1);
    expect(metrics.reviewPackagesActive).toBe(1);
    expect(metrics.reviewPackagesTotal).toBe(1);
  });

  it("returns zeroed metrics for an empty workspace", () => {
    const metrics = deriveOperatorHomeWorkspaceMetrics([], 0);

    expect(metrics).toEqual({
      reviewPackagesTotal: 0,
      reviewPackagesCommitted: 0,
      reviewPackagesActive: 0,
      reviewPackagesAwaitingApproval: 0,
      openFindings: 0,
      governanceWarnings: 0,
      evidenceSources: 0,
      hasReviews: false,
    });
  });

  it("aggregates loaded-page KPIs when the dashboard is paginated", () => {
    const items: RunSummary[] = [
      makeRun({
        runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        hasFindingsSnapshot: true,
        findingCount: 2,
        hasGovernanceWarnings: true,
      }),
    ];

    const metrics = deriveOperatorHomeWorkspaceMetrics(items, 10);

    expect(metrics.reviewPackagesTotal).toBe(10);
    expect(metrics.hasReviews).toBe(true);
    expect(metrics.openFindings).toBe(2);
    expect(metrics.reviewPackagesCommitted).toBe(0);
    expect(metrics.reviewPackagesActive).toBe(1);
    expect(metrics.governanceWarnings).toBe(1);
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

  it("normalizes non-finite totalCount to zero for home KPI totals", () => {
    const metrics = deriveOperatorHomeWorkspaceMetrics([], Number.NaN);

    expect(metrics.reviewPackagesTotal).toBe(0);
    expect(metrics.hasReviews).toBe(false);
  });

  it("treats non-finite totalCount as stale when overview rows are loaded on the page", () => {
    const items: RunSummary[] = [
      makeRun({
        runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        hasFindingsSnapshot: true,
      }),
      makeRun({
        runId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        hasFindingsSnapshot: true,
      }),
    ];

    const metrics = deriveOperatorHomeWorkspaceMetrics(items, Number.NaN);

    expect(metrics.reviewPackagesTotal).toBe(2);
    expect(metrics.hasReviews).toBe(true);
  });

  it("normalizes non-finite awaitingApprovalCount to zero for home KPI totals", () => {
    const metrics = deriveOperatorHomeWorkspaceMetrics([], 2, Number.NaN);

    expect(metrics.reviewPackagesAwaitingApproval).toBe(0);
  });

  it("does not keep stale positive totalCount when overview rows are archived-only", () => {
    const items: RunSummary[] = [
      makeRun({
        runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        isArchived: true,
        hasGoldenManifest: true,
      }),
    ];

    const metrics = deriveOperatorHomeWorkspaceMetrics(items, 12);

    expect(metrics.reviewPackagesTotal).toBe(0);
    expect(metrics.hasReviews).toBe(false);
  });

  it("does not uplift stale zero totalCount using archived-only overview rows", () => {
    const items: RunSummary[] = [
      makeRun({
        runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        isArchived: true,
        hasGoldenManifest: true,
      }),
      makeRun({
        runId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        isArchived: true,
        hasGoldenManifest: true,
      }),
    ];

    const metrics = deriveOperatorHomeWorkspaceMetrics(items, 0);

    expect(metrics.reviewPackagesTotal).toBe(0);
    expect(metrics.hasReviews).toBe(false);
  });

  it("treats zero totalCount as stale when active overview rows are loaded on the page", () => {
    const items: RunSummary[] = [
      makeRun({
        runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        hasFindingsSnapshot: true,
      }),
    ];

    const metrics = deriveOperatorHomeWorkspaceMetrics(items, 0);

    expect(metrics.reviewPackagesTotal).toBe(1);
    expect(metrics.hasReviews).toBe(true);
  });

  it("excludes archived runs from workspace metrics aggregates", () => {
    const items: RunSummary[] = [
      makeRun({
        runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        hasFindingsSnapshot: true,
        hasGoldenManifest: false,
      }),
      makeRun({
        runId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        isArchived: true,
        hasGoldenManifest: true,
        findingCount: 5,
        hasGovernanceWarnings: true,
        hasContextSnapshot: true,
      }),
    ];

    const metrics = deriveOperatorHomeWorkspaceMetrics(items, 2);

    expect(metrics.reviewPackagesCommitted).toBe(0);
    expect(metrics.reviewPackagesActive).toBe(1);
    expect(metrics.openFindings).toBe(0);
    expect(metrics.governanceWarnings).toBe(0);
    expect(metrics.evidenceSources).toBe(1);
  });
});

describe("formatOperatorHomeCompactMetricsLine", () => {
  it("normalizes non-finite workspace metric counts in the KPI strip", () => {
    const line = formatOperatorHomeCompactMetricsLine({
      metrics: {
        reviewPackagesTotal: 2,
        reviewPackagesCommitted: Number.NaN,
        reviewPackagesActive: Number.NaN,
        reviewPackagesAwaitingApproval: 0,
        openFindings: Number.NaN,
        governanceWarnings: Number.NaN,
        evidenceSources: 0,
        hasReviews: true,
      },
      setupReadyCount: 1,
      setupTotalCount: 2,
      setupReadinessLoading: false,
    });

    expect(line).toBe(
      "0 Active reviews · 0 sealed review records · 0 Open findings · 0 approval warnings · Setup 1/2",
    );
    expect(line).not.toMatch(/NaN/);
  });
});

describe("formatSetupReadinessLabel", () => {
  it("formats ready counts", () => {
    expect(formatSetupReadinessLabel(2, 4)).toBe("2 of 4 ready");
  });

  it("normalizes non-finite setup readiness counts to zero", () => {
    expect(formatSetupReadinessLabel(Number.NaN, 4)).toBe("0 of 4 ready");
    expect(formatSetupReadinessLabel(2, Number.NaN)).toBe("2 of 0 ready");
  });
});

describe("formatSetupReadinessCompleteLabel", () => {
  it("formats complete counts for Continue setup status copy", () => {
    expect(formatSetupReadinessCompleteLabel(2, 4)).toBe("2 of 4 complete");
  });
});
