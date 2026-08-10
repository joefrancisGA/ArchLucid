import {
  describeSponsorProofReadiness,
  formatStructuralExecutionModeLabel,
  isAgentOutputPilotStrictSponsorSafe,
  isExternalSponsorPdfBlockedForExecutionMode,
  isProjectedDollarClaimsSponsorSafe,
  isProjectedUsdSponsorBadgeVisible,
} from "@/lib/pilot-proof-readiness";
import { describe, expect, it } from "vitest";

describe("isProjectedDollarClaimsSponsorSafe", () => {
  it("returns true only when proof JSON marks projected dollars sponsor-safe", () => {
    expect(
      isProjectedDollarClaimsSponsorSafe({
        proofPackageCompleteness: {
          roiBaselineInputs: { projectedDollarClaimsSponsorSafe: true },
        },
      }),
    ).toBe(true);

    expect(
      isProjectedDollarClaimsSponsorSafe({
        proofPackageCompleteness: {
          roiBaselineInputs: { projectedDollarClaimsSponsorSafe: false },
        },
      }),
    ).toBe(false);

    expect(isProjectedDollarClaimsSponsorSafe(null)).toBe(false);
  });
});

describe("isProjectedUsdSponsorBadgeVisible", () => {
  it("requires sponsor-safe projected dollars and non-blocked execution mode", () => {
    const sponsorSafeReal = {
      structuralExecutionMode: "Real",
      proofPackageCompleteness: {
        roiBaselineInputs: { projectedDollarClaimsSponsorSafe: true },
      },
    } as const;

    expect(isProjectedUsdSponsorBadgeVisible(sponsorSafeReal)).toBe(true);

    expect(
      isProjectedUsdSponsorBadgeVisible({
        structuralExecutionMode: "Simulator",
        proofPackageCompleteness: {
          roiBaselineInputs: { projectedDollarClaimsSponsorSafe: true },
        },
      }),
    ).toBe(false);

    expect(
      isProjectedUsdSponsorBadgeVisible({
        structuralExecutionMode: "Real",
        proofPackageCompleteness: {
          roiBaselineInputs: { projectedDollarClaimsSponsorSafe: false },
        },
      }),
    ).toBe(false);
  });
});

describe("isExternalSponsorPdfBlockedForExecutionMode", () => {
  it("blocks Simulator, Fallback, Mixed, and real-mode fallback substitution", () => {
    expect(
      isExternalSponsorPdfBlockedForExecutionMode({ structuralExecutionMode: "Simulator" }),
    ).toBe(true);
    expect(
      isExternalSponsorPdfBlockedForExecutionMode({ structuralExecutionMode: 0 }),
    ).toBe(true);
    expect(
      isExternalSponsorPdfBlockedForExecutionMode({ structuralExecutionMode: "Fallback" }),
    ).toBe(true);
    expect(
      isExternalSponsorPdfBlockedForExecutionMode({ structuralExecutionMode: "Mixed" }),
    ).toBe(true);
    expect(
      isExternalSponsorPdfBlockedForExecutionMode({ realModeFellBackToSimulator: true, structuralExecutionMode: "Real" }),
    ).toBe(true);
  });

  it("allows Real mode without fallback substitution", () => {
    expect(
      isExternalSponsorPdfBlockedForExecutionMode({ structuralExecutionMode: "Real" }),
    ).toBe(false);
    expect(
      isExternalSponsorPdfBlockedForExecutionMode({ structuralExecutionMode: 1 }),
    ).toBe(false);
  });
});

describe("formatStructuralExecutionModeLabel", () => {
  it("normalizes enum names and numeric wire values", () => {
    expect(formatStructuralExecutionModeLabel({ structuralExecutionMode: 1 })).toBe("Real");
    expect(formatStructuralExecutionModeLabel({ structuralExecutionMode: "Simulator" })).toBe("Simulator");
  });
});

describe("isAgentOutputPilotStrictSponsorSafe", () => {
  it("returns false when PilotStrict evidence is not satisfied", () => {
    expect(
      isAgentOutputPilotStrictSponsorSafe({
        proofPackageCompleteness: { agentOutputPilotStrictEvidenceSatisfied: false },
      }),
    ).toBe(false);
  });

  it("returns true when satisfied or field is absent", () => {
    expect(
      isAgentOutputPilotStrictSponsorSafe({
        proofPackageCompleteness: { agentOutputPilotStrictEvidenceSatisfied: true },
      }),
    ).toBe(true);

    expect(isAgentOutputPilotStrictSponsorSafe({ proofPackageCompleteness: {} })).toBe(true);
  });
});

describe("describeSponsorProofReadiness", () => {
  it("returns null when proofPackageCompleteness is absent", () => {
    expect(describeSponsorProofReadiness({ isDemoTenant: false })).toBeNull();
    expect(describeSponsorProofReadiness(null)).toBeNull();
  });

  it("uses persisted sponsorProofReadiness Sendable when present", () => {
    const copy = describeSponsorProofReadiness({
      isDemoTenant: false,
      proofPackageCompleteness: {
        sponsorProofReadiness: "Sendable",
        demoTenantWarningRequired: false,
        proofSendability: "Sendable",
        roiEvidenceConfidence: "Strong",
      },
    });

    expect(copy?.variant).toBe("ready");
    expect(copy?.classification).toBe("Sendable");
  });

  it("maps sponsorProofReadiness NeedsBaseline to caveats", () => {
    const copy = describeSponsorProofReadiness({
      isDemoTenant: false,
      proofPackageCompleteness: {
        sponsorProofReadiness: "NeedsBaseline",
        proofSendability: "SendableWithCaveats",
        roiEvidenceConfidence: "Strong",
      },
    });

    expect(copy?.variant).toBe("caveats");
    expect(copy?.classification).toBe("NeedsBaseline");
  });

  it("maps sponsorProofReadiness Incomplete to blocked", () => {
    const copy = describeSponsorProofReadiness({
      isDemoTenant: false,
      proofPackageCompleteness: {
        sponsorProofReadiness: "Incomplete",
        proofSendability: "SendableWithCaveats",
        roiEvidenceConfidence: "Strong",
      },
    });

    expect(copy?.variant).toBe("blocked");
    expect(copy?.classification).toBe("Incomplete");
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
    expect(copy?.classification).toBe("DemoOnly");
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
    expect(copy?.classification).toBe("DemoOnly");
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
    expect(copy?.classification).toBeNull();
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
    expect(copy?.classification).toBeNull();
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
    expect(copy?.classification).toBeNull();
  });
});
