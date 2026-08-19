import { describe, expect, it } from "vitest";

import {
  filterEligiblePatternInsightCards,
  isPatternLibraryAggregateThresholdMet,
  type PatternInsightCard,
} from "@/lib/pattern-library-aggregate-threshold";

function card(patternKey: string, contributingTenantCount: number): PatternInsightCard {
  return {
    patternKey,
    industryVertical: "Insurance",
    summary: "Summary",
    contributingTenantCount,
  };
}

describe("pattern-library-aggregate-threshold", () => {
  it("requires five contributing tenants per card", () => {
    const eligible = filterEligiblePatternInsightCards([
      card("a", 4),
      card("b", 5),
      card("c", 6),
    ]);

    expect(eligible.map((entry) => entry.patternKey)).toEqual(["b", "c"]);
  });

  it("requires at least three eligible cards for nav threshold", () => {
    expect(
      isPatternLibraryAggregateThresholdMet([
        card("a", 5),
        card("b", 5),
      ]),
    ).toBe(false);

    expect(
      isPatternLibraryAggregateThresholdMet([
        card("a", 5),
        card("b", 5),
        card("c", 5),
      ]),
    ).toBe(true);
  });
});
