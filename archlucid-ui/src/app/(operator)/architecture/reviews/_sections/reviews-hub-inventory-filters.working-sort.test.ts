import { describe, expect, it } from "vitest";

import type { RunSummary } from "@/types/authority";

import {
  sortRunsForInventory,
  sortRunsForWorkingReviewsHubInventory,
} from "./reviews-hub-inventory-filters";

function run(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    runId: "run-default",
    projectId: "default",
    createdUtc: "2026-01-01T00:00:00Z",
    hasGoldenManifest: true,
    hasFindingsSnapshot: true,
    ...overrides,
  } as RunSummary;
}

describe("sortRunsForWorkingReviewsHubInventory (LI-08)", () => {
  it("surfaces in-flight store run ids and mid-execute packages above finalized samples", () => {
    const runs = [
      run({ runId: "finalized", createdUtc: "2026-03-01T00:00:00Z" }),
      run({
        runId: "mid-execute",
        hasGoldenManifest: false,
        hasFindingsSnapshot: false,
        createdUtc: "2026-02-01T00:00:00Z",
      }),
      run({
        runId: "tracked",
        hasGoldenManifest: false,
        hasFindingsSnapshot: true,
        createdUtc: "2026-01-01T00:00:00Z",
      }),
    ];

    const sorted = sortRunsForWorkingReviewsHubInventory(
      runs,
      () => false,
      new Set(["tracked"]),
    );

    expect(sorted.map((item) => item.runId)).toEqual(["tracked", "mid-execute", "finalized"]);
  });

  it("keeps guided inventory sort unchanged", () => {
    const runs = [
      run({ runId: "older", createdUtc: "2026-01-01T00:00:00Z" }),
      run({ runId: "newer", createdUtc: "2026-03-01T00:00:00Z" }),
    ];

    expect(sortRunsForInventory(runs, () => false).map((item) => item.runId)).toEqual([
      "newer",
      "older",
    ]);
  });
  it("orders a finalized package by its completed time ahead of a later-created draft", () => {
    const runs = [
      run({
        runId: "created-later",
        createdUtc: "2026-03-01T00:00:00Z",
        hasGoldenManifest: false,
      }),
      run({
        runId: "finalized-early-created",
        createdUtc: "2026-01-01T00:00:00Z",
        completedUtc: "2026-05-01T00:00:00Z",
        hasGoldenManifest: true,
      }),
    ];

    expect(sortRunsForInventory(runs, () => false).map((item) => item.runId)).toEqual([
      "finalized-early-created",
      "created-later",
    ]);
  });
});
