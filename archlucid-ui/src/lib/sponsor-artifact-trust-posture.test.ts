import { describe, expect, it } from "vitest";

import { resolveSponsorArtifactTrustPostures } from "@/lib/sponsor-artifact-trust-posture";

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
