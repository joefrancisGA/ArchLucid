import { describe, expect, it } from "vitest";

import { buildExecutiveValueNarrative } from "@/lib/executive-value-narrative";

describe("buildExecutiveValueNarrative", () => {
  it("includes reviews, findings, hours, savings, and top action", () => {
    const line = buildExecutiveValueNarrative({
      reviewsCount: 2,
      findingsCount: 5,
      estimatedHoursSaved: 12,
      estimatedUsdSavings: 1500,
      topRecommendedAction: {
        id: "orphan",
        headline: "Review orphan candidates",
        explanation: "Unused resources may be accruing cost.",
        href: "/dashboard",
        sortWeight: 100,
      },
    });

    expect(line).toContain("2 reviews");
    expect(line).toContain("5 findings");
    expect(line).toContain("$1,500");
    expect(line).toContain("12 h saved");
    expect(line).toContain("Top action: Review orphan candidates");
  });
});
