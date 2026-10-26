import { describe, expect, it } from "vitest";

import {
  resolveOperatorHomeLiveRunsSnapshotTotalCount,
  resolveOperatorHomeRunsPanelReportedTotalCount,
} from "@/lib/operator/operator-home-live-runs-dashboard";
import { deriveOperatorHomeTenantCountingSnapshot } from "@/lib/operator/operator-home-tenant-counting";
import { deriveOperatorHomeWorkspaceMetricsFromOverviewRuns } from "@/lib/operator/operator-home-workspace-metrics";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

describe("deriveOperatorHomeTenantCountingSnapshot", () => {
  it("keeps workspace totalCount when the overview page is empty but pagination metadata is present", () => {
    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems: [],
      previewItems: [],
      runsDashboardTotalCount: 8,
    });

    expect(snapshot.metrics.reviewPackagesTotal).toBe(8);
    expect(snapshot.metrics.hasReviews).toBe(true);
  });

  it("matches panel-reported totals when runsDashboardTotalCount is non-finite", () => {
    const items: RunSummary[] = [
      {
        runId: "tenant-a",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
      {
        runId: "tenant-b",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems: items,
      previewItems: items,
      runsDashboardTotalCount: Number.NaN,
    });

    expect(snapshot.metrics.reviewPackagesTotal).toBe(
      resolveOperatorHomeRunsPanelReportedTotalCount(items, Number.NaN),
    );
  });

  it("matches panel-reported totals when runsDashboardTotalCount is negative", () => {
    const items: RunSummary[] = [
      {
        runId: "tenant-a",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
      {
        runId: "tenant-b",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems: items,
      previewItems: items,
      runsDashboardTotalCount: -4,
    });

    expect(snapshot.metrics.reviewPackagesTotal).toBe(
      resolveOperatorHomeRunsPanelReportedTotalCount(items, -4),
    );
  });

  it("is idempotent when runsDashboardTotalCount is already panel-normalized on archived-only pages", () => {
    const displayItems: RunSummary[] = [
      {
        runId: "archived-1",
        projectId: "default",
        hasGoldenManifest: true,
        isArchived: true,
      },
    ];
    const normalized = resolveOperatorHomeRunsPanelReportedTotalCount(displayItems, 12);

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems,
      previewItems: displayItems,
      runsDashboardTotalCount: normalized,
    });

    expect(normalized).toBe(0);
    expect(snapshot.metrics.reviewPackagesTotal).toBe(0);
    expect(snapshot.metrics.hasReviews).toBe(false);
  });

  it("matches panel-reported totals when runsDashboardTotalCount undercounts visible tenant rows", () => {
    const items: RunSummary[] = [
      {
        runId: "tenant-a",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
      {
        runId: "tenant-b",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems: items,
      previewItems: items,
      runsDashboardTotalCount: 1,
    });

    expect(snapshot.metrics.reviewPackagesTotal).toBe(
      resolveOperatorHomeRunsPanelReportedTotalCount(items, 1),
    );
  });

  it("aligns preview recent totals with tenant metrics when buyer shell excludes the static showcase id", () => {
    const items: RunSummary[] = [
      {
        runId: "tenant-1",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
      {
        runId: SHOWCASE_STATIC_DEMO_RUN_ID,
        projectId: "default",
        hasGoldenManifest: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems: items,
      previewItems: items,
      excludeShowcaseRunId: SHOWCASE_STATIC_DEMO_RUN_ID,
    });

    expect(snapshot.metrics.reviewPackagesTotal).toBe(1);
    expect(snapshot.previewTabCounts.recentTotalCount).toBe(1);
  });

  it("matches live snapshot total resolution when runsDashboardTotalCount is omitted", () => {
    const items: RunSummary[] = [
      {
        runId: "tenant-a",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
      {
        runId: "tenant-b",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems: items,
      previewItems: items,
    });
    const liveSnapshotTotal = resolveOperatorHomeLiveRunsSnapshotTotalCount(items);
    const overviewMetrics = deriveOperatorHomeWorkspaceMetricsFromOverviewRuns(items);

    expect(snapshot.metrics.reviewPackagesTotal).toBe(liveSnapshotTotal);
    expect(overviewMetrics.reviewPackagesTotal).toBe(liveSnapshotTotal);
  });

  it("normalizes non-finite awaitingApprovalCount to zero in metrics", () => {
    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems: [
        {
          runId: "tenant-1",
          projectId: "default",
          hasFindingsSnapshot: true,
        },
      ],
      previewItems: [],
      awaitingApprovalCount: Number.NaN,
    });

    expect(snapshot.metrics.reviewPackagesAwaitingApproval).toBe(0);
  });

  it("matches panel-normalized totals when raw pagination metadata is stale on archived-only pages", () => {
    const displayItems: RunSummary[] = [
      {
        runId: "archived-1",
        projectId: "default",
        hasGoldenManifest: true,
        isArchived: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems,
      previewItems: displayItems,
      runsDashboardTotalCount: 12,
    });

    expect(snapshot.metrics.reviewPackagesTotal).toBe(0);
    expect(snapshot.metrics.hasReviews).toBe(false);
  });

  it("uplifts review totals from visible tenant rows when runsDashboardTotalCount is omitted (TB-1039)", () => {
    const items: RunSummary[] = [
      {
        runId: "demo-seed",
        projectId: "default",
        demoSeededOverviewInject: true,
        hasGoldenManifest: true,
      },
      {
        runId: "tenant-1",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems: items,
      previewItems: items,
    });

    expect(snapshot.metrics.reviewPackagesTotal).toBe(1);
    expect(snapshot.metrics.hasReviews).toBe(true);
  });

  it("does not apply workspace totalCount when only demo-seeded overview rows are on the page (TB-1039)", () => {
    const items: RunSummary[] = [
      {
        runId: "demo-seed",
        projectId: "default",
        demoSeededOverviewInject: true,
        hasGoldenManifest: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems: items,
      previewItems: items,
      runsDashboardTotalCount: 5,
    });

    expect(snapshot.tenantItems).toHaveLength(0);
    expect(snapshot.metrics.reviewPackagesTotal).toBe(0);
    expect(snapshot.metrics.hasReviews).toBe(false);
  });

  it("scopes metrics and preview counts to tenant-authored reviews", () => {
    const items: RunSummary[] = [
      {
        runId: "tenant-1",
        projectId: "default",
        hasGoldenManifest: true,
        findingCount: 2,
        hasFindingsSnapshot: true,
      },
      {
        runId: "demo-seed",
        projectId: "default",
        demoSeededOverviewInject: true,
        hasGoldenManifest: true,
      },
      {
        runId: "tenant-2",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
      {
        runId: "tenant-3",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems: items,
      previewItems: items,
    });

    expect(snapshot.tenantItems).toHaveLength(3);
    expect(snapshot.metrics.reviewPackagesCommitted).toBe(1);
    expect(snapshot.metrics.reviewPackagesActive).toBe(2);
    expect(snapshot.previewTabCounts.recentTotalCount).toBe(3);
    expect(snapshot.previewTabCounts.recentVisibleCount).toBe(2);
    expect(snapshot.previewTabCounts.all).toBe(2);
    expect(snapshot.previewTabCounts.attention).toBe(snapshot.metrics.reviewPackagesActive > 0 ? 2 : 0);
  });

  it("excludes archived runs from home preview tab counts", () => {
    const items: RunSummary[] = [
      {
        runId: "tenant-active",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
      {
        runId: "tenant-archived-sealed",
        projectId: "default",
        hasGoldenManifest: true,
        isArchived: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems: items,
      previewItems: items,
    });

    expect(snapshot.metrics.reviewPackagesCommitted).toBe(0);
    expect(snapshot.previewTabCounts.approved).toBe(0);
    expect(snapshot.previewTabCounts.attention).toBe(1);
  });

  it("falls back to workspace awaiting-approval count when preview rows lack queue membership", () => {
    const items: RunSummary[] = [
      {
        runId: "tenant-1",
        projectId: "default",
        hasGoldenManifest: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems: items,
      previewItems: items,
      awaitingApprovalCount: 3,
      awaitingApprovalRunIds: ["other-run"],
    });

    expect(snapshot.previewTabCounts["awaiting-approval"]).toBe(3);
  });

  it("uses previewItems for tab counts when unfinished-work rail dedup shrinks the preview pool", () => {
    const displayItems: RunSummary[] = [
      {
        runId: "run-1",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
      {
        runId: "run-2",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
      {
        runId: "run-3",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
    ];
    const previewItems: RunSummary[] = [
      {
        runId: "run-3",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems,
      previewItems,
    });

    expect(snapshot.previewTabCounts.attention).toBe(1);
    expect(snapshot.previewTabCounts.recentTotalCount).toBe(1);
    expect(snapshot.metrics.reviewPackagesActive).toBe(3);
  });

  it("uses runsDashboardTotalCount for reviewPackagesTotal when the dashboard page is paginated", () => {
    const displayItems: RunSummary[] = [
      {
        runId: "run-1",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems,
      previewItems: displayItems,
      runsDashboardTotalCount: 42,
    });

    expect(snapshot.metrics.reviewPackagesTotal).toBe(42);
    expect(snapshot.metrics.reviewPackagesActive).toBe(1);
  });

  it("uplifts understated runsDashboardTotalCount when more tenant rows are visible than the API total", () => {
    const displayItems: RunSummary[] = [
      {
        runId: "run-1",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
      {
        runId: "run-2",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems,
      previewItems: displayItems,
      runsDashboardTotalCount: 1,
    });

    expect(snapshot.metrics.reviewPackagesTotal).toBe(2);
  });

  it("does not treat archived-only tenant rows as reviews when runsDashboardTotalCount is omitted", () => {
    const displayItems: RunSummary[] = [
      {
        runId: "archived-1",
        projectId: "default",
        hasGoldenManifest: true,
        isArchived: true,
      },
      {
        runId: "archived-2",
        projectId: "default",
        hasGoldenManifest: true,
        isArchived: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems,
      previewItems: displayItems,
    });

    expect(snapshot.metrics.reviewPackagesTotal).toBe(0);
    expect(snapshot.metrics.hasReviews).toBe(false);
  });

  it("does not keep stale positive runsDashboardTotalCount when tenant rows are archived-only", () => {
    const displayItems: RunSummary[] = [
      {
        runId: "archived-1",
        projectId: "default",
        hasGoldenManifest: true,
        isArchived: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems,
      previewItems: displayItems,
      runsDashboardTotalCount: 12,
    });

    expect(snapshot.metrics.reviewPackagesTotal).toBe(0);
    expect(snapshot.metrics.hasReviews).toBe(false);
  });

  it("does not uplift stale zero runsDashboardTotalCount using archived-only tenant rows", () => {
    const displayItems: RunSummary[] = [
      {
        runId: "archived-1",
        projectId: "default",
        hasGoldenManifest: true,
        isArchived: true,
      },
      {
        runId: "archived-2",
        projectId: "default",
        hasGoldenManifest: true,
        isArchived: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems,
      previewItems: displayItems,
      runsDashboardTotalCount: 0,
    });

    expect(snapshot.metrics.reviewPackagesTotal).toBe(0);
    expect(snapshot.metrics.hasReviews).toBe(false);
  });

  it("treats zero runsDashboardTotalCount as stale when tenant overview rows are loaded", () => {
    const displayItems: RunSummary[] = [
      {
        runId: "run-1",
        projectId: "default",
        hasFindingsSnapshot: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems,
      previewItems: displayItems,
      runsDashboardTotalCount: 0,
    });

    expect(snapshot.metrics.reviewPackagesTotal).toBe(1);
    expect(snapshot.metrics.hasReviews).toBe(true);
  });

  it("does not fall back to workspace awaiting-approval count while queue ids are still loading", () => {
    const items: RunSummary[] = [
      {
        runId: "tenant-1",
        projectId: "default",
        hasGoldenManifest: true,
      },
    ];

    const snapshot = deriveOperatorHomeTenantCountingSnapshot({
      displayItems: items,
      previewItems: items,
      awaitingApprovalCount: 3,
    });

    expect(snapshot.previewTabCounts["awaiting-approval"]).toBe(0);
  });
});
