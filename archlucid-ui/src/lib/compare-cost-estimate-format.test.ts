import { describe, expect, it } from "vitest";

import { formatCompareCostEstimateCell } from "@/lib/compare-cost-estimate-format";

describe("formatCompareCostEstimateCell", () => {
  it("returns bare numeric values without inventing currency or period", () => {
    expect(formatCompareCostEstimateCell(100)).toEqual({ display: "Unit not recorded", unitUnknown: true });
    expect(formatCompareCostEstimateCell("120")).toEqual({ display: "Unit not recorded", unitUnknown: true });
    expect(formatCompareCostEstimateCell(-100)).toEqual({ display: "Unit not recorded", unitUnknown: true });
    expect(formatCompareCostEstimateCell("+120")).toEqual({ display: "Unit not recorded", unitUnknown: true });
    expect(formatCompareCostEstimateCell("−1,200.50")).toEqual({ display: "Unit not recorded", unitUnknown: true });
  });

  it.each([4.2e-7, -1e21, "1.2E+8"])(
    "does not expose the unitless scientific-notation cost %s as an estimate",
    (value) => {
      expect(formatCompareCostEstimateCell(value)).toEqual({
        display: "Unit not recorded",
        unitUnknown: true,
      });
    },
  );

  it("preserves values that already include currency markers", () => {
    expect(formatCompareCostEstimateCell("$4,200/mo")).toEqual({
      display: "$4,200/mo",
      unitUnknown: false,
    });
  });

  it("returns em dash for empty values", () => {
    expect(formatCompareCostEstimateCell(null)).toEqual({ display: "Cost estimate was not stored.", unitUnknown: false });
    expect(formatCompareCostEstimateCell("")).toEqual({ display: "Cost estimate was stored empty.", unitUnknown: false });
  });
});
