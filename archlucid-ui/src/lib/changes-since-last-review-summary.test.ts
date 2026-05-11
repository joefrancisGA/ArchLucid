import { describe, expect, it } from "vitest";

import type { RunComparison } from "@/types/authority";

import { deriveChangesSinceLastReviewCopy } from "./changes-since-last-review-summary";

describe("deriveChangesSinceLastReviewCopy", () => {
  it("returns null when manifest comparison has no usable deltas", () => {
    const cmp: RunComparison = {
      leftRunId: "a",
      rightRunId: "b",
      runLevelDiffs: [],
      manifestComparison: {
        leftManifestId: "m1",
        rightManifestId: "m2",
        leftManifestHash: "h1",
        rightManifestHash: "h2",
        addedCount: 0,
        removedCount: 0,
        changedCount: 0,
        diffs: [],
      },
      hasManifestComparison: true,
    };

    expect(deriveChangesSinceLastReviewCopy(cmp)).toBeNull();
  });

  it("summarizes issue and warning net deltas plus severity shifts", () => {
    const cmp: RunComparison = {
      leftRunId: "a",
      rightRunId: "b",
      runLevelDiffs: [],
      manifestComparison: {
        leftManifestId: "m1",
        rightManifestId: "m2",
        leftManifestHash: "h1",
        rightManifestHash: "h2",
        addedCount: 2,
        removedCount: 1,
        changedCount: 0,
        diffs: [
          {
            section: "Issues",
            key: "Issue A",
            diffKind: "Added",
            beforeValue: null,
            afterValue: "Critical",
          },
          {
            section: "Issues",
            key: "Issue B",
            diffKind: "Added",
            beforeValue: null,
            afterValue: "Medium",
          },
          {
            section: "Issues",
            key: "Issue C",
            diffKind: "Removed",
            beforeValue: "High",
            afterValue: null,
          },
          {
            section: "Warnings",
            key: "w1",
            diffKind: "Added",
            beforeValue: null,
            afterValue: null,
          },
        ],
      },
      hasManifestComparison: true,
    };

    const derived = deriveChangesSinceLastReviewCopy(cmp);

    expect(derived).not.toBeNull();
    expect(derived?.netChangeLine).toBe("+2 new findings, -1 resolved, +1 new warning");
    expect(derived?.severityShiftLine).toContain("new Critical");
    expect(derived?.severityShiftLine).toContain("new Medium");
    expect(derived?.severityShiftLine).toContain("resolved High");
  });
});
