import { describe, expect, it } from "vitest";

import type { SponsorRoiSummary } from "@/lib/sponsor/sponsor-report-markdown";
import {
  hasSponsorCommittedReviews,
  isSponsorDashboardEmpty,
  isSponsorSampleWorkspaceData,
} from "@/lib/sponsor/sponsor-dashboard-workspace-state";

function summary(partial: Partial<SponsorRoiSummary>): SponsorRoiSummary {
  return partial as SponsorRoiSummary;
}

describe("sponsor-dashboard-workspace-state", () => {
  it("detects committed reviews from system or run counts", () => {
    expect(hasSponsorCommittedReviews(summary({ systemCount: 1, latestRunCount: 0 }))).toBe(true);
    expect(hasSponsorCommittedReviews(summary({ systemCount: 0, latestRunCount: 2 }))).toBe(true);
    expect(hasSponsorCommittedReviews(summary({ systemCount: 0, latestRunCount: 0 }))).toBe(false);
    expect(hasSponsorCommittedReviews(null)).toBe(false);
  });

  it("detects sample workspace pricing basis", () => {
    expect(isSponsorSampleWorkspaceData(summary({ savingsPricingBasis: "Illustrative demo pricing" }))).toBe(true);
    expect(isSponsorSampleWorkspaceData(summary({ savingsPricingBasis: "Uploaded actual/amortized" }))).toBe(false);
  });

  it("treats loading as not empty", () => {
    expect(isSponsorDashboardEmpty(summary({ systemCount: 0, latestRunCount: 0 }), true)).toBe(false);
    expect(isSponsorDashboardEmpty(summary({ systemCount: 0, latestRunCount: 0 }), false)).toBe(true);
  });
});
