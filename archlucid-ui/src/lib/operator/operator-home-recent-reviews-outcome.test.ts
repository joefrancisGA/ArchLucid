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
import { deriveOperatorHomeTenantCountingSnapshot } from "@/lib/operator/operator-home-tenant-counting";
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

  it("omits awaiting-approval copy when suppressAwaitingApprovalCount is set", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      ...emptyMetrics,
      reviewPackagesTotal: 2,
      reviewPackagesCommitted: 1,
      evidenceSources: 1,
      hasReviews: true,
    };

    expect(
      formatOperatorHomeRecentReviewsOutcome(metrics, {
        awaitingApprovalCount: 3,
        suppressAwaitingApprovalCount: true,
      }),
    ).toBe("2 reviews · 1 sealed review record · 0 open findings");
    expect(
      formatOperatorHomeRecentReviewsOutcome(metrics, {
        awaitingApprovalCount: 3,
        suppressAwaitingApprovalCount: true,
      }),
    ).not.toContain("awaiting approval");
  });

  it("uses workspace pagination total in the headline while preview cap counts stay in the recent pool", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      ...emptyMetrics,
      reviewPackagesTotal: 42,
      reviewPackagesActive: 1,
      evidenceSources: 1,
      hasReviews: true,
    };

    expect(
      formatOperatorHomeRecentReviewsOutcome(metrics, { visibleCount: 2, recentTotalCount: 2 }),
    ).toBe("42 reviews · 1 active · 0 open findings · showing 2");
  });

  it("normalizes non-finite workspace metrics in recent reviews outcome copy", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      ...emptyMetrics,
      reviewPackagesTotal: Number.NaN,
      openFindings: Number.NaN,
      hasReviews: true,
    };

    expect(formatOperatorHomeRecentReviewsOutcome(metrics)).toBe("0 reviews · 0 open findings");
    expect(formatOperatorHomeRecentReviewsOutcome(metrics)).not.toMatch(/NaN/);
  });

  it("normalizes non-finite recent preview cap counts in outcome copy", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      ...emptyMetrics,
      reviewPackagesTotal: 2,
      evidenceSources: 1,
      hasReviews: true,
    };

    expect(
      formatOperatorHomeRecentReviewsOutcome(metrics, {
        visibleCount: Number.NaN,
        recentTotalCount: 4,
      }),
    ).toBe("2 reviews · 0 open findings · showing 0 of 4");
    expect(
      formatOperatorHomeRecentReviewsOutcome(metrics, {
        visibleCount: 2,
        recentTotalCount: Number.NaN,
      }),
    ).toBe("2 reviews · 0 open findings · showing 2");
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
  it("returns no outcome parts when the workspace has no reviews (empty state owns copy)", () => {
    expect(buildOperatorHomeRecentReviewsOutcomeParts(emptyMetrics)).toEqual([]);
  });

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

  it("normalizes non-finite preview cap counts in structured outcome parts", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      ...emptyMetrics,
      reviewPackagesTotal: 4,
      evidenceSources: 1,
      hasReviews: true,
    };

    const parts = buildOperatorHomeRecentReviewsOutcomeParts(metrics, {
      visibleCount: Number.NaN,
      recentTotalCount: 4,
    });

    expect(parts.find((part) => part.key === "showing-cap")).toEqual({
      key: "showing-cap",
      text: "showing 0 of 4",
    });
  });

  it("omits structured awaiting-approval part when suppressAwaitingApprovalCount is set", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      ...emptyMetrics,
      reviewPackagesTotal: 2,
      reviewPackagesCommitted: 1,
      evidenceSources: 1,
      hasReviews: true,
    };

    const parts = buildOperatorHomeRecentReviewsOutcomeParts(metrics, {
      awaitingApprovalCount: 3,
      suppressAwaitingApprovalCount: true,
    });

    expect(parts.find((part) => part.key === "awaiting-approval")).toBeUndefined();
  });

  it("keeps workspace pagination total on reviews-total while preview cap stays in the recent pool", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      ...emptyMetrics,
      reviewPackagesTotal: 42,
      reviewPackagesActive: 1,
      evidenceSources: 1,
      hasReviews: true,
    };

    const parts = buildOperatorHomeRecentReviewsOutcomeParts(metrics, {
      visibleCount: 2,
      recentTotalCount: 2,
    });

    expect(parts.find((part) => part.key === "reviews-total")).toEqual({
      key: "reviews-total",
      text: "42 reviews",
      hrefKind: "all-reviews",
    });
    expect(parts.find((part) => part.key === "showing")).toEqual({
      key: "showing",
      text: "showing 2",
      hrefKind: "tab",
      tabId: "all",
    });
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
  it("normalizes non-finite workspace awaiting-approval fallback for tab counts", () => {
    const items: RunSummary[] = [{ runId: "run-1", projectId: "default" }];

    const counts = deriveHomePreviewTabCounts({
      previewItems: items,
      awaitingApprovalRunIds: ["missing-run"],
      awaitingApprovalCount: Number.NaN,
    });

    expect(counts["awaiting-approval"]).toBe(0);
  });

  it("counts awaiting-approval tab rows when queue run ids have surrounding whitespace", () => {
    const items: RunSummary[] = [{ runId: "run-a", projectId: "default" }];

    const counts = deriveHomePreviewTabCounts({
      previewItems: items,
      awaitingApprovalRunIds: [" run-a "],
    });

    expect(counts["awaiting-approval"]).toBe(1);
  });

  it("excludes showcase rows when the showcase run id token has surrounding whitespace", () => {
    const items: RunSummary[] = [
      { runId: "run-1", projectId: "default" },
      { runId: "showcase", projectId: "default" },
    ];

    const counts = deriveHomePreviewTabCounts({
      previewItems: items,
      excludeShowcaseRunId: " showcase ",
    });

    expect(counts.recentTotalCount).toBe(1);
  });

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

  it("keeps awaiting-approval tab at zero when queue ids omit preview rows and workspace count is zero", () => {
    const items: RunSummary[] = [{ runId: "run-1", projectId: "default" }];

    const counts = deriveHomePreviewTabCounts({
      previewItems: items,
      awaitingApprovalRunIds: ["other-run"],
      awaitingApprovalCount: 0,
    });

    expect(counts["awaiting-approval"]).toBe(0);
  });

  it("excludes archived runs from attention and approved tab counts", () => {
    const items: RunSummary[] = [
      {
        runId: "active-attention",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
      {
        runId: "archived-approved",
        projectId: "default",
        hasGoldenManifest: true,
        isArchived: true,
      },
    ];

    const counts = deriveHomePreviewTabCounts({ previewItems: items });

    expect(counts.attention).toBe(1);
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

  it("excludes showcase story rows matched by description from tenant metrics", () => {
    const items: RunSummary[] = [
      {
        runId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        projectId: "default",
        description: "Enterprise customer intake modernization review",
        hasFindingsSnapshot: true,
        findingCount: 4,
      },
    ];

    expect(isExampleOnlyOverviewRunList(items)).toBe(true);
    expect(filterTenantOverviewRuns(items)).toEqual([]);
    expect(
      deriveOperatorHomeTenantCountingSnapshot({
        displayItems: items,
        previewItems: items,
        runsDashboardTotalCount: 1,
      }).metrics.reviewPackagesTotal,
    ).toBe(0);
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
