import { describe, expect, it } from "vitest";

import { formatCompareCostEstimateCell } from "@/lib/compare-cost-estimate-format";

describe("formatCompareCostEstimateCell", () => {
  it("returns bare numeric values without inventing currency or period", () => {
    expect(formatCompareCostEstimateCell(100)).toEqual({ display: "100", unitUnknown: true });
    expect(formatCompareCostEstimateCell("120")).toEqual({ display: "120", unitUnknown: true });
  });

  it("preserves values that already include currency markers", () => {
    expect(formatCompareCostEstimateCell("$4,200/mo")).toEqual({
      display: "$4,200/mo",
      unitUnknown: false,
    });
  });

  it("returns em dash for empty values", () => {
    expect(formatCompareCostEstimateCell(null)).toEqual({ display: "—", unitUnknown: false });
    expect(formatCompareCostEstimateCell("")).toEqual({ display: "—", unitUnknown: false });
  });
});
