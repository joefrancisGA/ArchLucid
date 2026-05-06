import { describeSponsorProofReadiness } from "@/lib/pilot-proof-readiness";
import { describe, expect, it } from "vitest";

describe("describeSponsorProofReadiness", () => {
  it("returns null when proofPackageCompleteness is absent", () => {
    expect(describeSponsorProofReadiness({ isDemoTenant: false })).toBeNull();
    expect(describeSponsorProofReadiness(null)).toBeNull();
  });

  it("blocks on demo tenant flag even when sendability is Sendable", () => {
    const copy = describeSponsorProofReadiness({
      isDemoTenant: false,
      proofPackageCompleteness: {
        demoTenantWarningRequired: true,
        proofSendability: "Sendable",
        roiEvidenceConfidence: "Strong",
      },
    });

    expect(copy?.variant).toBe("blocked");
    expect(copy?.title).toMatch(/demo/i);
  });

  it("blocks on isDemoTenant with completeness Sendable", () => {
    const copy = describeSponsorProofReadiness({
      isDemoTenant: true,
      proofPackageCompleteness: {
        demoTenantWarningRequired: false,
        proofSendability: "Sendable",
        roiEvidenceConfidence: "Strong",
      },
    });

    expect(copy?.variant).toBe("blocked");
  });

  it("returns ready for non-demo Sendable Strong ROI", () => {
    const copy = describeSponsorProofReadiness({
      isDemoTenant: false,
      proofPackageCompleteness: {
        demoTenantWarningRequired: false,
        proofSendability: "Sendable",
        publishingTier: "Complete",
        roiEvidenceConfidence: "Strong",
      },
    });

    expect(copy?.variant).toBe("ready");
  });

  it("returns caveats for Sendable with Low ROI confidence", () => {
    const copy = describeSponsorProofReadiness({
      isDemoTenant: false,
      proofPackageCompleteness: {
        demoTenantWarningRequired: false,
        proofSendability: "Sendable",
        roiEvidenceConfidence: "Low",
      },
    });

    expect(copy?.variant).toBe("caveats");
  });

  it("returns caveats for SendableWithCaveats", () => {
    const copy = describeSponsorProofReadiness({
      isDemoTenant: false,
      proofPackageCompleteness: {
        demoTenantWarningRequired: false,
        proofSendability: "SendableWithCaveats",
        roiEvidenceConfidence: "Strong",
      },
    });

    expect(copy?.variant).toBe("caveats");
  });
});
