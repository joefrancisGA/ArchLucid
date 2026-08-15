import { describe, expect, it } from "vitest";

import {
  aggregateFindingsByCategory,
  formatFindingsByCategory,
} from "./architecture-lifecycle-batch-findings";

describe("architecture-lifecycle-batch-findings", () => {
  it("aggregates finding counts by category from findingsSnapshot", () => {
    const counts = aggregateFindingsByCategory({
      findingsSnapshot: {
        findings: [
          { category: "Security", findingId: "a" },
          { findingCategory: "Reliability", findingId: "b" },
          { category: "Security", findingId: "c" },
        ],
      },
    });

    expect(counts).toEqual({ Security: 2, Reliability: 1 });
  });

  it("returns empty map when snapshot is missing", () => {
    expect(aggregateFindingsByCategory({})).toEqual({});
    expect(aggregateFindingsByCategory(null)).toEqual({});
  });

  it("formats category counts for batch reports", () => {
    expect(formatFindingsByCategory({ Security: 2, Cost: 1 })).toBe("Security:2, Cost:1");
    expect(formatFindingsByCategory({})).toBe("—");
  });
});
