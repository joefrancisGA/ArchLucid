import { describe, expect, it } from "vitest";

import {
  countNonArchivedOverviewRuns,
  resolveOperatorHomeReviewTotalCount,
  resolveOperatorHomeTenantScopedReviewTotalCount,
} from "@/lib/operator/operator-home-review-total-resolution";
import type { RunSummary } from "@/types/authority";

describe("resolveOperatorHomeReviewTotalCount", () => {
  it("uplifts stale zero totals from visible active rows and SSR floor", () => {
    expect(resolveOperatorHomeReviewTotalCount(0, 5, 2)).toBe(5);
  });

  it("does not uplift stale zero totals when only archived rows are visible", () => {
    expect(resolveOperatorHomeReviewTotalCount(0, 5, 0)).toBe(0);
  });

  it("does not keep stale positive totals when only archived rows are on the page", () => {
    expect(resolveOperatorHomeReviewTotalCount(10, 5, 0, 2)).toBe(0);
  });

  it("does not keep stale positive reported totals when only archived rows are on the page", () => {
    expect(resolveOperatorHomeReviewTotalCount(8, 0, 0, 2)).toBe(0);
  });

  it("keeps positive totals when the page is empty but pagination metadata is present", () => {
    expect(resolveOperatorHomeReviewTotalCount(10, 5, 0, 0)).toBe(10);
  });

  it("does not fall back to SSR totals when only archived rows are on the page", () => {
    expect(resolveOperatorHomeReviewTotalCount(Number.NaN, 5, 0, 2)).toBe(0);
  });

  it("uplifts positive undercounts using visible active rows only", () => {
    expect(resolveOperatorHomeReviewTotalCount(1, 0, 2)).toBe(2);
  });
});

describe("resolveOperatorHomeTenantScopedReviewTotalCount", () => {
  it("returns zero for demo-only overview rows even when workspace totalCount is populated", () => {
    expect(
      resolveOperatorHomeTenantScopedReviewTotalCount(
        [
          {
            runId: "demo-seed",
            projectId: "default",
            demoSeededOverviewInject: true,
            hasGoldenManifest: true,
          },
        ],
        5,
      ),
    ).toBe(0);
  });

  it("keeps pagination totals when the overview page is empty", () => {
    expect(resolveOperatorHomeTenantScopedReviewTotalCount([], 8)).toBe(8);
  });

  it("keeps stale positive totals when active tenant rows share the page with archived rows", () => {
    expect(
      resolveOperatorHomeTenantScopedReviewTotalCount(
        [
          { runId: "active", projectId: "default", hasFindingsSnapshot: true },
          { runId: "archived", projectId: "default", isArchived: true, hasGoldenManifest: true },
        ],
        12,
      ),
    ).toBe(12);
  });
});

describe("countNonArchivedOverviewRuns", () => {
  it("counts runs without isArchived as active overview rows", () => {
    const items = [
      { runId: "active", projectId: "default" },
      { runId: "archived", projectId: "default", isArchived: true },
    ] as RunSummary[];

    expect(countNonArchivedOverviewRuns(items)).toBe(1);
  });
});
