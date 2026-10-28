import { describe, expect, it } from "vitest";

import {
  formatCompareStructuredNamedField,
  formatCompareStructuredSideValue,
} from "@/lib/compare/compare-structured-cell-honesty";

describe("compare structured cell honesty", () => {
  it("labels missing baseline and updated side values", () => {
    expect(formatCompareStructuredSideValue(null, "baseline")).toBe("Baseline review value was not stored.");
    expect(formatCompareStructuredSideValue(undefined, "updated")).toBe("Updated review value was not stored.");
  });

  it("labels stored-empty named fields", () => {
    expect(formatCompareStructuredNamedField("   ", "Requirement name")).toBe("Requirement name was stored empty.");
  });
});
