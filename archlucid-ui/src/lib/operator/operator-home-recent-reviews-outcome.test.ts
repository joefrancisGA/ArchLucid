import { describe, expect, it } from "vitest";

import { OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME } from "@/lib/buyer/buyer-polish-copy";
import {
  deriveHomePreviewTabCounts,
  filterTenantOverviewRuns,
  formatOperatorHomeRecentReviewsOutcome,
  isExampleOnlyOverviewRunList,
  OPERATOR_HOME_RECENT_FEATURED_LIMIT,
} from "@/lib/operator/operator-home-recent-reviews-outcome";
import type { OperatorHomeWorkspaceMetricsSnapshot } from "@/lib/operator/operator-home-workspace-metrics";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

describe("formatOperatorHomeRecentReviewsOutcome", () => {
  it("describes an empty workspace", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      reviewPackagesTotal: 0,
      reviewPackagesCommitted: 0,
      reviewPackagesActive: 0,
      openFindings: 0,
      governanceWarnings: 0,
      evidenceSources: 0,
      hasReviews: false,
    };

    expect(formatOperatorHomeRecentReviewsOutcome(metrics)).toBe(
      "No reviews in this workspace yet.",
    );
  });

  it("describes example-only lists without claiming the workspace is empty", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      reviewPackagesTotal: 0,
      reviewPackagesCommitted: 0,
      reviewPackagesActive: 0,
      openFindings: 0,
      governanceWarnings: 0,
      evidenceSources: 0,
      hasReviews: false,
    };

    expect(formatOperatorHomeRecentReviewsOutcome(metrics, { exampleReviewOnly: true })).toBe(
      OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME,
    );
  });

  it("summarizes committed packages with no open findings", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      reviewPackagesTotal: 4,
      reviewPackagesCommitted: 3,
      reviewPackagesActive: 1,
      openFindings: 0,
      governanceWarnings: 0,
      evidenceSources: 3,
      hasReviews: true,
    };

    expect(formatOperatorHomeRecentReviewsOutcome(metrics)).toBe(
      "3 finalized · 1 active · no open findings",
    );
  });

  it("summarizes committed packages with finding pressure", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      reviewPackagesTotal: 3,
      reviewPackagesCommitted: 2,
      reviewPackagesActive: 1,
      openFindings: 6,
      governanceWarnings: 1,
      evidenceSources: 3,
      hasReviews: true,
    };

    expect(formatOperatorHomeRecentReviewsOutcome(metrics)).toBe(
      "2 finalized · 1 active · 6 open findings · 1 with approval-check warnings",
    );
  });

  it("keeps the featured recent-review limit small", () => {
    expect(OPERATOR_HOME_RECENT_FEATURED_LIMIT).toBe(2);
  });
});

describe("deriveHomePreviewTabCounts", () => {
  it("caps the Recent tab at the featured limit and excludes showcase rows", () => {
    const items: RunSummary[] = [
      { runId: "run-1", projectId: "default" },
      { runId: "run-2", projectId: "default" },
      { runId: "run-3", projectId: "default" },
      { runId: "showcase", projectId: "default" },
    ];

    const counts = deriveHomePreviewTabCounts({
      previewItems: items,
      excludeShowcaseRunId: "showcase",
    });

    expect(counts.all).toBe(2);
    expect(counts.approved).toBe(0);
  });
});

describe("isExampleOnlyOverviewRunList", () => {
  it("treats showcase and demo-seeded rows as example-only", () => {
    const items: RunSummary[] = [
      {
        runId: SHOWCASE_STATIC_DEMO_RUN_ID,
        projectId: "default",
        demoSeededOverviewInject: true,
      },
    ];

    expect(isExampleOnlyOverviewRunList(items)).toBe(true);
    expect(filterTenantOverviewRuns(items)).toEqual([]);
  });

  it("returns false when a tenant review is present", () => {
    const items: RunSummary[] = [
      {
        runId: SHOWCASE_STATIC_DEMO_RUN_ID,
        projectId: "default",
      },
      {
        runId: "tenant-run-1",
        projectId: "default",
      },
    ];

    expect(isExampleOnlyOverviewRunList(items)).toBe(false);
    expect(filterTenantOverviewRuns(items)).toHaveLength(1);
  });
});
