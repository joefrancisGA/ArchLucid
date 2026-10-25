import { describe, expect, it } from "vitest";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { resolveLiveRunsDashboardModel } from "@/lib/operator/operator-home-live-runs-dashboard";
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

describe("resolveLiveRunsDashboardModel", () => {
  it("returns the server model unchanged before the runs panel reports", () => {
    expect(resolveLiveRunsDashboardModel(ssrModel, null)).toBe(ssrModel);
  });

  it("returns the server model when a partially mocked context omits the snapshot", () => {
    expect(resolveLiveRunsDashboardModel(ssrModel, undefined)).toBe(ssrModel);
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

  it("drops reviews that the refreshed snapshot no longer contains", () => {
    const merged = resolveLiveRunsDashboardModel(ssrModel, { items: [], totalCount: 0 });

    expect(merged.items).toEqual([]);
    expect(merged.totalCount).toBe(0);
  });
});
