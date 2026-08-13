import { describe, expect, it } from "vitest";

import type { ExecutiveRoiSummary } from "@/lib/executive/executive-summary-markdown";
import {
  hasExecutiveCommittedReviews,
  isExecutiveDashboardEmpty,
  isExecutiveSampleWorkspaceData,
} from "@/lib/executive/executive-dashboard-workspace-state";

function summary(partial: Partial<ExecutiveRoiSummary>): ExecutiveRoiSummary {
  return partial as ExecutiveRoiSummary;
}

describe("executive-dashboard-workspace-state", () => {
  it("detects committed reviews from system or run counts", () => {
    expect(hasExecutiveCommittedReviews(summary({ systemCount: 1, latestRunCount: 0 }))).toBe(true);
    expect(hasExecutiveCommittedReviews(summary({ systemCount: 0, latestRunCount: 2 }))).toBe(true);
    expect(hasExecutiveCommittedReviews(summary({ systemCount: 0, latestRunCount: 0 }))).toBe(false);
    expect(hasExecutiveCommittedReviews(null)).toBe(false);
  });

  it("detects sample workspace pricing basis", () => {
    expect(isExecutiveSampleWorkspaceData(summary({ savingsPricingBasis: "Illustrative demo pricing" }))).toBe(true);
    expect(isExecutiveSampleWorkspaceData(summary({ savingsPricingBasis: "Uploaded actual/amortized" }))).toBe(false);
  });

  it("treats loading as not empty", () => {
    expect(isExecutiveDashboardEmpty(summary({ systemCount: 0, latestRunCount: 0 }), true)).toBe(false);
    expect(isExecutiveDashboardEmpty(summary({ systemCount: 0, latestRunCount: 0 }), false)).toBe(true);
  });
});
