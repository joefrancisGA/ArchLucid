import { describe, expect, it } from "vitest";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import {
  resolveLiveRunsDashboardModel,
  resolveOperatorHomeLiveRunsSnapshotTotalCount,
  resolveOperatorHomeRunsPanelReportedTotalCount,
} from "@/lib/operator/operator-home-live-runs-dashboard";
import type { RunSummary } from "@/types/authority";

function buildRun(runId: string): RunSummary {
  return {
    runId,
    requestId: `req-${runId}`,
    projectId: "default",
    status: "InProgress",
  } as RunSummary;
}

const ssrModel: OperatorHomeRunsDashboardModel = {
  projectId: "default",
  page: 1,
  pageSize: 5,
  items: [buildRun("ssr-run")],
  totalCount: 1,
  loadFailure: null,
  malformedMessage: null,
  usedStaticRunsFallback: false,
  buyerPolishedShell: false,
};

describe("resolveOperatorHomeRunsPanelReportedTotalCount", () => {
  it("does not use archived rows when uplifting omitted API totals for the runs panel report", () => {
    expect(
      resolveOperatorHomeRunsPanelReportedTotalCount(
        [
          { ...buildRun("archived-a"), isArchived: true },
          { ...buildRun("archived-b"), isArchived: true },
          buildRun("active"),
        ],
        0,
      ),
    ).toBe(1);
  });

  it("keeps loaded pagination totals when they exceed the on-page active tenant row count", () => {
    expect(
      resolveOperatorHomeRunsPanelReportedTotalCount([buildRun("active-a"), buildRun("active-b")], 12),
    ).toBe(12);
  });

  it("uplifts undercounted loaded totals from visible active tenant rows on the current page", () => {
    expect(
      resolveOperatorHomeRunsPanelReportedTotalCount([buildRun("active-a"), buildRun("active-b")], 1),
    ).toBe(2);
  });

  it("is idempotent when loadedTotalCount is already panel-normalized on archived-only pages", () => {
    const items = [
      { ...buildRun("archived-a"), isArchived: true, hasGoldenManifest: true },
      { ...buildRun("archived-b"), isArchived: true, hasGoldenManifest: true },
    ];
    const normalized = resolveOperatorHomeRunsPanelReportedTotalCount(items, 12);

    expect(normalized).toBe(0);
    expect(resolveOperatorHomeRunsPanelReportedTotalCount(items, normalized)).toBe(0);
  });

  it("clamps negative loaded totals to zero before uplifting from visible active tenant rows", () => {
    expect(
      resolveOperatorHomeRunsPanelReportedTotalCount([buildRun("active-a"), buildRun("active-b")], -3),
    ).toBe(2);
  });

  it("keeps workspace totalCount when the overview page is empty but loaded pagination metadata is present", () => {
    expect(resolveOperatorHomeRunsPanelReportedTotalCount([], 8)).toBe(8);
  });

  it("uplifts omitted loaded totals from visible active tenant rows when loaded total is non-finite", () => {
    expect(
      resolveOperatorHomeRunsPanelReportedTotalCount([buildRun("active-a"), buildRun("active-b")], Number.NaN),
    ).toBe(2);
  });

  it("uplifts omitted loaded totals from the tenant row when a description-matched showcase shares the page", () => {
    expect(
      resolveOperatorHomeRunsPanelReportedTotalCount(
        [
          {
            ...buildRun("showcase-story"),
            description: "Enterprise customer intake modernization review",
            hasFindingsSnapshot: true,
            findingCount: 4,
          },
          buildRun("tenant-active"),
        ],
        0,
      ),
    ).toBe(1);
  });

  it("returns zero for description-matched showcase rows even when loaded total is positive", () => {
    expect(
      resolveOperatorHomeRunsPanelReportedTotalCount(
        [
          {
            ...buildRun("showcase-story"),
            description: "Enterprise customer intake modernization review",
            hasFindingsSnapshot: true,
            findingCount: 4,
          },
        ],
        5,
      ),
    ).toBe(0);
  });

  it("returns zero for archived-only pages when loadedTotalCount is non-finite", () => {
    expect(
      resolveOperatorHomeRunsPanelReportedTotalCount(
        [
          { ...buildRun("archived-a"), isArchived: true, hasGoldenManifest: true },
          { ...buildRun("archived-b"), isArchived: true, hasGoldenManifest: true },
        ],
        Number.NaN,
      ),
    ).toBe(0);
  });

  it("does not keep stale positive loaded totals when only archived tenant rows are on the page", () => {
    expect(
      resolveOperatorHomeRunsPanelReportedTotalCount(
        [
          { ...buildRun("archived-a"), isArchived: true, hasGoldenManifest: true },
          { ...buildRun("archived-b"), isArchived: true, hasGoldenManifest: true },
        ],
        12,
      ),
    ).toBe(0);
  });
});

describe("resolveOperatorHomeLiveRunsSnapshotTotalCount", () => {
  it("does not use archived row count when no explicit total is supplied", () => {
    expect(
      resolveOperatorHomeLiveRunsSnapshotTotalCount(
        [
          { ...buildRun("archived-a"), isArchived: true },
          { ...buildRun("archived-b"), isArchived: true },
        ],
      ),
    ).toBe(0);
  });

  it("falls back to visible active rows when no explicit total is supplied", () => {
    expect(
      resolveOperatorHomeLiveRunsSnapshotTotalCount([buildRun("live-a"), buildRun("live-b")]),
    ).toBe(2);
  });

  it("returns zero for demo-only items even when an explicit workspace total is supplied", () => {
    expect(
      resolveOperatorHomeLiveRunsSnapshotTotalCount(
        [
          {
            ...buildRun("demo-seed"),
            demoSeededOverviewInject: true,
            hasGoldenManifest: true,
          },
        ],
        5,
      ),
    ).toBe(0);
  });

  it("does not keep stale positive explicit totals when the snapshot is archived-only", () => {
    expect(
      resolveOperatorHomeLiveRunsSnapshotTotalCount(
        [
          { ...buildRun("archived-a"), isArchived: true },
          { ...buildRun("archived-b"), isArchived: true },
        ],
        5,
      ),
    ).toBe(0);
  });
});

describe("resolveLiveRunsDashboardModel", () => {
  it("returns the server model unchanged before the runs panel reports", () => {
    expect(resolveLiveRunsDashboardModel(ssrModel, null)).toBe(ssrModel);
  });

  it("returns the server model when a partially mocked context omits the snapshot", () => {
    expect(resolveLiveRunsDashboardModel(ssrModel, undefined)).toBe(ssrModel);
  });

  it("preserves SSR loadFailure metadata when a live snapshot overlay succeeds", () => {
    const merged = resolveLiveRunsDashboardModel(
      {
        ...ssrModel,
        totalCount: 12,
        loadFailure: {
          message: "Service unavailable",
          problem: null,
          correlationId: null,
          httpStatus: 503,
          retryAfterSeconds: null,
        },
      },
      {
        items: [buildRun("live-a")],
        totalCount: 1,
      },
    );

    expect(merged.loadFailure).toEqual({
      message: "Service unavailable",
      problem: null,
      correlationId: null,
      httpStatus: 503,
      retryAfterSeconds: null,
    });
    expect(merged.items.map((run) => run.runId)).toEqual(["live-a"]);
    expect(merged.totalCount).toBe(1);
  });

  it("overlays live items and total count while preserving the server scope fields", () => {
    const merged = resolveLiveRunsDashboardModel(ssrModel, {
      items: [buildRun("live-a"), buildRun("live-b")],
      totalCount: 7,
    });

    expect(merged.items.map((run) => run.runId)).toEqual(["live-a", "live-b"]);
    expect(merged.totalCount).toBe(7);
    expect(merged.projectId).toBe("default");
    expect(merged.pageSize).toBe(5);
    expect(merged.buyerPolishedShell).toBe(false);
  });

  it("keeps the server total count when the live snapshot total is non-finite", () => {
    const merged = resolveLiveRunsDashboardModel(ssrModel, {
      items: [buildRun("live-a")],
      totalCount: Number.NaN,
    });

    expect(merged.items.map((run) => run.runId)).toEqual(["live-a"]);
    expect(merged.totalCount).toBe(1);
  });

  it("treats non-finite live total count as stale when snapshot items exceed the server total", () => {
    const merged = resolveLiveRunsDashboardModel(ssrModel, {
      items: [buildRun("live-a"), buildRun("live-b")],
      totalCount: Number.NaN,
    });

    expect(merged.totalCount).toBe(2);
  });

  it("treats zero live total count as stale when snapshot items are present", () => {
    const merged = resolveLiveRunsDashboardModel(ssrModel, {
      items: [buildRun("live-a"), buildRun("live-b")],
      totalCount: 0,
    });

    expect(merged.items).toHaveLength(2);
    expect(merged.totalCount).toBe(2);
  });

  it("clamps negative live snapshot total counts to zero", () => {
    const merged = resolveLiveRunsDashboardModel(ssrModel, {
      items: [buildRun("live-a")],
      totalCount: -4,
    });

    expect(merged.totalCount).toBe(0);
    expect(merged.items.map((run) => run.runId)).toEqual(["live-a"]);
  });

  it("uplifts total when live count is positive but below the returned page size", () => {
    const merged = resolveLiveRunsDashboardModel(ssrModel, {
      items: [buildRun("live-a"), buildRun("live-b")],
      totalCount: 1,
    });

    expect(merged.totalCount).toBe(2);
  });

  it("drops reviews that the refreshed snapshot no longer contains", () => {
    const merged = resolveLiveRunsDashboardModel(ssrModel, { items: [], totalCount: 0 });

    expect(merged.items).toEqual([]);
    expect(merged.totalCount).toBe(0);
  });

  it("does not revive SSR pagination totals when the live snapshot clears items", () => {
    const merged = resolveLiveRunsDashboardModel(
      { ...ssrModel, totalCount: 12 },
      { items: [], totalCount: 0 },
    );

    expect(merged.items).toEqual([]);
    expect(merged.totalCount).toBe(0);
  });

  it("does not uplift stale zero totalCount using archived-only snapshot rows", () => {
    const merged = resolveLiveRunsDashboardModel(ssrModel, {
      items: [
        { ...buildRun("archived-a"), isArchived: true },
        { ...buildRun("archived-b"), isArchived: true },
      ],
      totalCount: 0,
    });

    expect(merged.items).toHaveLength(2);
    expect(merged.totalCount).toBe(0);
  });

  it("does not fall back to the SSR total when the live snapshot is archived-only with non-finite totalCount", () => {
    const merged = resolveLiveRunsDashboardModel(ssrModel, {
      items: [{ ...buildRun("archived-a"), isArchived: true }],
      totalCount: Number.NaN,
    });

    expect(merged.totalCount).toBe(0);
  });

  it("does not uplift demo-only live snapshots from SSR totals during merge", () => {
    const merged = resolveLiveRunsDashboardModel(
      { ...ssrModel, totalCount: 5 },
      {
        items: [
          {
            ...buildRun("demo-seed"),
            demoSeededOverviewInject: true,
            hasGoldenManifest: true,
          },
        ],
        totalCount: resolveOperatorHomeLiveRunsSnapshotTotalCount(
          [
            {
              ...buildRun("demo-seed"),
              demoSeededOverviewInject: true,
              hasGoldenManifest: true,
            },
          ],
          5,
        ),
      },
    );

    expect(merged.totalCount).toBe(0);
  });

  it("does not keep stale positive totalCount when the live snapshot is archived-only", () => {
    const merged = resolveLiveRunsDashboardModel(ssrModel, {
      items: [
        { ...buildRun("archived-a"), isArchived: true },
        { ...buildRun("archived-b"), isArchived: true },
      ],
      totalCount: 12,
    });

    expect(merged.items).toHaveLength(2);
    expect(merged.totalCount).toBe(0);
  });
});
