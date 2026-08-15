import { describe, expect, it } from "vitest";

import {
  resolveSponsorRoiIdentifiedVsRealized,
} from "@/lib/sponsor/sponsor-roi-identified-vs-realized";
import type { SponsorRoiSummary } from "@/lib/sponsor/sponsor-report-markdown";

function sampleSummary(overrides: Partial<SponsorRoiSummary> = {}): SponsorRoiSummary {
  return {
    totalEstimatedUsdSavings: 120_000,
    systemCount: 2,
    latestRunCount: 2,
    eaDiscountMultiplier: 1,
    savingsPricingBasis: "Retail",
    systems: [],
    topSystemicIssues: [],
    basisBreakdown: {
      openEstimatedUsd: 80_000,
      acceptedRiskUsd: 5_000,
      needsEvidenceUsd: 40_000,
      deferredUsd: 10_000,
      waivedUsd: 2_000,
      realizedUsd: 25_000,
      rejectedNotApplicableUsd: 3_000,
      totalPotentialUsd: 137_000,
    },
    ...overrides,
  };
}

describe("resolveSponsorRoiIdentifiedVsRealized", () => {
  it("maps open + needs-evidence to identified pending and remediated to realized", () => {
    const buckets = resolveSponsorRoiIdentifiedVsRealized(sampleSummary());

    expect(buckets.identifiedPendingApprovalUsd).toBe(120_000);
    expect(buckets.realizedCommittedUsd).toBe(25_000);
    expect(buckets.hasBasisBreakdown).toBe(true);
    expect(buckets.deferredWaivedAcceptedUsd).toBe(20_000);
  });

  it("falls back to headline total when basis breakdown is absent", () => {
    const buckets = resolveSponsorRoiIdentifiedVsRealized(
      sampleSummary({ basisBreakdown: undefined, totalEstimatedUsdSavings: 55_000 }),
    );

    expect(buckets.identifiedPendingApprovalUsd).toBe(55_000);
    expect(buckets.realizedCommittedUsd).toBe(0);
    expect(buckets.hasBasisBreakdown).toBe(false);
  });
});
