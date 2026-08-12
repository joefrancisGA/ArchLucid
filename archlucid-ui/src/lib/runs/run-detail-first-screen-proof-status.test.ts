import { describe, expect, it } from "vitest";

import {
  buildRunDetailFirstScreenProofSummary,
} from "@/lib/runs/run-detail-first-screen-proof-status";

describe("buildRunDetailFirstScreenProofSummary", () => {
  it("returns READY when sendable and PilotStrict satisfied with classified ROI", () => {
    const summary = buildRunDetailFirstScreenProofSummary({
      structuralExecutionMode: "Real",
      roiMetricSources: [{ metricKey: "hours", label: "Hours", value: "4", sourceKind: "TenantMeasured" }],
      proofPackageCompleteness: {
        sponsorProofReadiness: "Sendable",
        agentOutputPilotStrictEvidenceSatisfied: true,
      },
    });

    expect(summary.disposition).toBe("READY");
    expect(summary.cardTitle).toBe("Why this is safe to send");
    expect(summary.proofConfidenceLabel).toBe("Real-mode verified");
    expect(summary.whySafeToSendBullets.length).toBeGreaterThan(0);
    expect(summary.whySafeToSendBullets.join(" ")).toContain("strict AI quality checks");
    expect(summary.whySafeToSendBullets.join(" ").toLowerCase()).not.toContain("pilotstrict");
  });

  it("returns WARN for sendable-with-caveats posture", () => {
    const summary = buildRunDetailFirstScreenProofSummary({
      proofPackageCompleteness: {
        proofSendability: "SendableWithCaveats",
        agentOutputPilotStrictEvidenceSatisfied: true,
      },
    });

    expect(summary.disposition).toBe("WARN");
  });

  it("returns HOLD when PilotStrict fails or ROI is unsourced", () => {
    const strictHold = buildRunDetailFirstScreenProofSummary({
      proofPackageCompleteness: {
        sponsorProofReadiness: "Sendable",
        agentOutputPilotStrictEvidenceSatisfied: false,
      },
    });

    expect(strictHold.disposition).toBe("HOLD");
    expect(strictHold.whySafeToSendBullets.join(" ")).toContain("Strict AI quality");
    expect(strictHold.whySafeToSendBullets.join(" ").toLowerCase()).not.toContain("pilotstrict");

    const roiHold = buildRunDetailFirstScreenProofSummary({
      estimatedUsdSavings: 5000,
      proofPackageCompleteness: {
        sponsorProofReadiness: "Sendable",
        agentOutputPilotStrictEvidenceSatisfied: true,
      },
    });

    expect(roiHold.disposition).toBe("HOLD");
    expect(roiHold.roiBasisLabel).toContain("HOLD");
    expect(roiHold.cardTitle).toBe("Why sponsor send is blocked");
  });

  it("uses review vocabulary in simulator fallback bullets", () => {
    const summary = buildRunDetailFirstScreenProofSummary({
      realModeFellBackToSimulator: true,
      proofPackageCompleteness: {
        sponsorProofReadiness: "Sendable",
        agentOutputPilotStrictEvidenceSatisfied: true,
      },
    });

    expect(summary.whySafeToSendBullets.join(" ").toLowerCase()).toContain("this review");
    expect(summary.detail?.toLowerCase()).toContain("this review");
  });

  it("returns 'Not available' for governed coverage when field is absent", () => {
    const summary = buildRunDetailFirstScreenProofSummary(null);

    expect(summary.governedCoverageLabel).toBe("Not available");
  });

  it("returns 'Not available' when isAvailable is false", () => {
    const summary = buildRunDetailFirstScreenProofSummary({
      governedFindingCoverage: { isAvailable: false },
    });

    expect(summary.governedCoverageLabel).toBe("Not available");
  });

  it("formats governed coverage correctly when metric is present", () => {
    const summary = buildRunDetailFirstScreenProofSummary({
      governedFindingCoverage: {
        isAvailable: true,
        governedCount: 8,
        totalDecisionGradeCount: 10,
        governedPercentage: 80.0,
        advisoryCount: 2,
      },
    });

    expect(summary.governedCoverageLabel).toBe("8 of 10 governed (80.0%)");
  });

  it("handles null governedPercentage gracefully", () => {
    const summary = buildRunDetailFirstScreenProofSummary({
      governedFindingCoverage: {
        isAvailable: true,
        governedCount: 0,
        totalDecisionGradeCount: 5,
        governedPercentage: null,
        advisoryCount: 5,
      },
    });

    expect(summary.governedCoverageLabel).toBe("0 of 5 governed (n/a)");
  });
});
