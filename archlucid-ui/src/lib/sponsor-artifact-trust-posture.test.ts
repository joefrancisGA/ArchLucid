import { describe, expect, it } from "vitest";

import {
  presentSponsorRoiHeadline,
  resolveSponsorArtifactTrustPostures,
} from "@/lib/sponsor-artifact-trust-posture";

describe("resolveSponsorArtifactTrustPostures", () => {
  it("returns manual review for demo tenants", () => {
    const badges = resolveSponsorArtifactTrustPostures({ isDemoTenant: true });

    expect(badges.some((b) => b.posture === "manual-review-required")).toBe(true);
    expect(badges).toHaveLength(1);
  });

  it("includes estimate when projected dollars are not sponsor-safe", () => {
    const badges = resolveSponsorArtifactTrustPostures({
      proofPackageCompleteness: {
        roiBaselineInputs: { projectedDollarClaimsSponsorSafe: false },
        agentOutputPilotStrictEvidenceSatisfied: true,
      },
    });

    expect(badges.some((b) => b.posture === "estimate")).toBe(true);
  });

  it("includes evidence-backed when sponsor-safe and PilotStrict pass", () => {
    const badges = resolveSponsorArtifactTrustPostures({
      proofPackageCompleteness: {
        roiBaselineInputs: { projectedDollarClaimsSponsorSafe: true },
        agentOutputPilotStrictEvidenceSatisfied: true,
        sponsorProofReadiness: "Sendable",
      },
    });

    expect(badges.some((b) => b.posture === "evidence-backed")).toBe(true);
  });
});

describe("presentSponsorRoiHeadline", () => {
  it("never allows demo-derived numbers as sponsor headlines", () => {
    const presentation = presentSponsorRoiHeadline({ isDemoTenant: true });

    expect(presentation.eligibility).toBe("illustrative-only");
    expect(presentation.containerLabel).toMatch(/Illustrative/i);
    expect(presentation.containerLabel).toMatch(/demo data/i);
  });

  it("keeps buyer-strong ROI headline-eligible", () => {
    const presentation = presentSponsorRoiHeadline({
      proofPackageCompleteness: {
        roiEvidenceConfidence: "Strong tenant baseline",
      },
      savingsPricingBasis: "Uploaded actual/amortized",
    });

    expect(presentation.eligibility).toBe("headline-eligible");
    expect(presentation.containerLabel).toBeNull();
  });

  it("suppresses missing evidence with a baseline CTA", () => {
    const presentation = presentSponsorRoiHeadline({
      savingsPricingBasis: "Unknown basis",
      proofPackageCompleteness: {
        roiEvidenceConfidence: "",
      },
    });

    expect(["suppressed-with-cta", "illustrative-only"]).toContain(presentation.eligibility);
  });
});
