import { describe, expect, it } from "vitest";

import { OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME } from "@/lib/buyer/buyer-polish-copy";
import {
  buildOperatorHomeRecentReviewsOutcomeParts,
  deriveHomePreviewTabCounts,
  filterTenantOverviewRuns,
  formatOperatorHomeRecentReviewsOutcome,
  isExampleOnlyOverviewRunList,
  OPERATOR_HOME_RECENT_FEATURED_LIMIT,
} from "@/lib/operator/operator-home-recent-reviews-outcome";
import type { OperatorHomeWorkspaceMetricsSnapshot } from "@/lib/operator/operator-home-workspace-metrics";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

const emptyMetrics: OperatorHomeWorkspaceMetricsSnapshot = {
  reviewPackagesTotal: 0,
  reviewPackagesCommitted: 0,
  reviewPackagesActive: 0,
  reviewPackagesAwaitingApproval: 0,
  openFindings: 0,
  governanceWarnings: 0,
  evidenceSources: 0,
  hasReviews: false,
};

describe("formatOperatorHomeRecentReviewsOutcome", () => {
  it("describes an empty workspace", () => {
    expect(formatOperatorHomeRecentReviewsOutcome(emptyMetrics)).toBe(
      "No reviews in this workspace yet.",
    );
  });

  it("describes example-only lists without claiming the workspace is empty", () => {
    expect(formatOperatorHomeRecentReviewsOutcome(emptyMetrics, { exampleReviewOnly: true })).toBe(
      OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME,
    );
  });

  it("summarizes population, lifecycle, and preview cap with no open findings", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      ...emptyMetrics,
      reviewPackagesTotal: 4,
      reviewPackagesCommitted: 3,
      reviewPackagesActive: 1,
      evidenceSources: 3,
      hasReviews: true,
    };

    expect(formatOperatorHomeRecentReviewsOutcome(metrics, { visibleCount: 2, recentTotalCount: 4 })).toBe(
      "4 reviews · 3 sealed review records · 1 active · 0 open findings · showing 2 of 4",
    );
  });

  it("summarizes committed packages with finding pressure", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      ...emptyMetrics,
      reviewPackagesTotal: 3,
      reviewPackagesCommitted: 2,
      reviewPackagesActive: 1,
      openFindings: 6,
      governanceWarnings: 1,
      evidenceSources: 3,
      hasReviews: true,
    };

    expect(formatOperatorHomeRecentReviewsOutcome(metrics, { visibleCount: 2, recentTotalCount: 3 })).toBe(
      "3 reviews · 2 sealed review records · 1 active · 6 open findings · with 1 approval warning · showing 2 of 3",
    );
  });

  it("keeps the featured recent-review limit small", () => {
    expect(OPERATOR_HOME_RECENT_FEATURED_LIMIT).toBe(2);
  });
});

describe("buildOperatorHomeRecentReviewsOutcomeParts", () => {
  it("routes sealed record counts to the reviews list instead of a hidden approved tab", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      ...emptyMetrics,
      reviewPackagesTotal: 4,
      reviewPackagesCommitted: 3,
      reviewPackagesActive: 1,
      evidenceSources: 3,
      hasReviews: true,
    };

    const parts = buildOperatorHomeRecentReviewsOutcomeParts(metrics);

    expect(parts.find((part) => part.key === "sealed-records")).toEqual({
      key: "sealed-records",
      text: "3 sealed review records",
      hrefKind: "all-reviews",
    });
    expect(parts.find((part) => part.key === "open-findings")?.tabId).toBe("attention");
  });

  it("renders showing-cap as plain text without a link target", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      ...emptyMetrics,
      reviewPackagesTotal: 4,
      reviewPackagesCommitted: 3,
      reviewPackagesActive: 1,
      evidenceSources: 3,
      hasReviews: true,
    };

    const parts = buildOperatorHomeRecentReviewsOutcomeParts(metrics, {
      visibleCount: 2,
      recentTotalCount: 4,
    });

    expect(parts.find((part) => part.key === "showing-cap")).toEqual({
      key: "showing-cap",
      text: "showing 2 of 4",
    });
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
    expect(counts.recentVisibleCount).toBe(2);
    expect(counts.recentTotalCount).toBe(3);
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
