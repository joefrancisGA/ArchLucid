import { describe, expect, it } from "vitest";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { resolveLiveRunsDashboardModel } from "@/lib/operator-home-live-runs-dashboard";
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

  it("drops reviews that the refreshed snapshot no longer contains", () => {
    const merged = resolveLiveRunsDashboardModel(ssrModel, { items: [], totalCount: 0 });

    expect(merged.items).toEqual([]);
    expect(merged.totalCount).toBe(0);
  });
});
