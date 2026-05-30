import { describe, expect, it } from "vitest";

import {
  buildRunDetailFirstScreenProofSummary,
} from "@/lib/run-detail-first-screen-proof-status";

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
    expect(summary.whySafeToSendBullets.length).toBeGreaterThan(0);
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
});
