import { describe, expect, it } from "vitest";

import { runsListPageFilterStatusLine } from "./runs-list-filter-status-line";

import type { RunSummary } from "@/types/authority";

describe("runsListPageFilterStatusLine", () => {
  it("uses compact copy when the full page matches", () => {
    expect(runsListPageFilterStatusLine(1, 1, false)).toBe("1 review on this page.");
    expect(runsListPageFilterStatusLine(3, 3, false)).toBe("3 reviews on this page.");
  });

  it("uses subset wording when filtered", () => {
    expect(runsListPageFilterStatusLine(1, 12, true)).toBe("Showing 1 of 12 on this page (matches filter)");
  });

  it("names a single finalized package for buyer-polished workspaces", () => {
    const run: RunSummary = {
      runId: "r1",
      projectId: "default",
      description: "Demo",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasGoldenManifest: true,
    };

    expect(runsListPageFilterStatusLine(1, 1, false, { buyerPolished: true, soleVisibleRun: run })).toBe(
      "1 finalized review package on this page.",
    );
  });

  it("names a single in-flight review for buyer-polished workspaces", () => {
    const run: RunSummary = {
      runId: "r1",
      projectId: "default",
      description: "Demo",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasGoldenManifest: false,
    };

    expect(runsListPageFilterStatusLine(1, 1, false, { buyerPolished: true, soleVisibleRun: run })).toBe(
      "1 in-flight review on this page.",
    );
  });
});
