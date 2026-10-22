import { describe, expect, it } from "vitest";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { buildSponsorValueNarrative } from "@/lib/sponsor/sponsor-value-narrative";

describe("buildSponsorValueNarrative", () => {
  it("includes reviews, findings, hours, savings, and top action", () => {
    const line = buildSponsorValueNarrative({
      reviewsCount: 2,
      findingsCount: 5,
      estimatedHoursSaved: 12,
      estimatedUsdSavings: 1500,
      topRecommendedAction: {
        id: "orphan",
        headline: "Review orphan candidates",
        explanation: "Unused resources may be accruing cost.",
        href: SPONSOR_DASHBOARD_HREF,
        sortWeight: 100,
      },
    });

    expect(line).toContain("2 reviews");
    expect(line).toContain("5 findings");
    expect(line).toContain("$1,500");
    expect(line).toContain("12 h saved");
  });

  it("qualifies estimated hours in buyer-polished mode", () => {
    const line = buildSponsorValueNarrative({
      reviewsCount: 1,
      findingsCount: 0,
      estimatedHoursSaved: 8,
      estimatedUsdSavings: null,
      topRecommendedAction: null,
      qualifyEstimatedHours: true,
    });

    expect(line).toContain("~8 h saved (estimated)");
  });
});
