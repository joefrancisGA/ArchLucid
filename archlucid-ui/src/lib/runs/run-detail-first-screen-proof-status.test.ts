import { describe, expect, it } from "vitest";

import {
  buildRunDetailFirstScreenProofSummary,
  shouldShowRunDetailFirstScreenProofStatus,
} from "@/lib/runs/run-detail-first-screen-proof-status";

describe("shouldShowRunDetailFirstScreenProofStatus", () => {
  it("hides sponsor-send proof posture when execution failed or incomplete", () => {
    expect(shouldShowRunDetailFirstScreenProofStatus({ legacyRunStatus: "Failed" })).toBe(false);
    expect(shouldShowRunDetailFirstScreenProofStatus({ legacyRunStatus: "FailedPartial" })).toBe(false);
    expect(shouldShowRunDetailFirstScreenProofStatus({ legacyRunStatus: "PartiallyCompleted" })).toBe(false);
    expect(shouldShowRunDetailFirstScreenProofStatus({ isDeadLettered: true })).toBe(false);
  });

  it("shows sponsor-send proof posture when a sendable review exists", () => {
    expect(shouldShowRunDetailFirstScreenProofStatus({ legacyRunStatus: "Completed" })).toBe(true);
    expect(shouldShowRunDetailFirstScreenProofStatus({ legacyRunStatus: "ExecutionCompletedQualityRejected" })).toBe(
      true,
    );
    expect(shouldShowRunDetailFirstScreenProofStatus({ legacyRunStatus: null })).toBe(true);
  });
});

describe("buildRunDetailFirstScreenProofSummary", () => {
  it("does not read READY when strict sponsor proof flag was omitted", () => {
    const summary = buildRunDetailFirstScreenProofSummary({
      proofPackageCompleteness: {
        sponsorProofReadiness: "Sendable",
      },
    });

    expect(summary.pilotStrictLabel).toBe("Strict sponsor proof was not stored.");
    expect(summary.cardTitle).not.toBe("Why this is safe to send");
    expect(summary.disposition).toBe("HOLD");
  });

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

  it("labels governed coverage as not stored when field is absent", () => {
    const summary = buildRunDetailFirstScreenProofSummary(null);

    expect(summary.governedCoverageLabel).toBe("Governed coverage was not stored.");
    expect(summary.proofPacketLabel).toBe("Proof completeness was not stored.");
  });

  it("labels unavailable governed coverage without implying a stored metric", () => {
    const summary = buildRunDetailFirstScreenProofSummary({
      governedFindingCoverage: { isAvailable: false },
    });

    expect(summary.governedCoverageLabel).toBe("Governed coverage was not available.");
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

    expect(summary.governedCoverageLabel).toBe("8 of 10 evidence-backed (80.0%)");
  });

  it("labels null governed counts and percentage without printing 0 or n/a (P-10)", () => {
    const nullPercentage = buildRunDetailFirstScreenProofSummary({
      governedFindingCoverage: {
        isAvailable: true,
        governedCount: 0,
        totalDecisionGradeCount: 5,
        governedPercentage: null,
        advisoryCount: 5,
      },
    });

    expect(nullPercentage.governedCoverageLabel).toBe(
      "0 of 5 evidence-backed (Governed percentage was not stored.)",
    );

    const nullGovernedCount = buildRunDetailFirstScreenProofSummary({
      governedFindingCoverage: {
        isAvailable: true,
        governedCount: null,
        totalDecisionGradeCount: 5,
        governedPercentage: 80,
        advisoryCount: 5,
      },
    });

    expect(nullGovernedCount.governedCoverageLabel).toBe("Governed count was not stored.");
  });

  it("labels ROI basis as not stored when freshness and catalog are absent (P-07)", () => {
    const summary = buildRunDetailFirstScreenProofSummary({
      proofPackageCompleteness: {
        sponsorProofReadiness: "Sendable",
        agentOutputPilotStrictEvidenceSatisfied: true,
      },
    });

    expect(summary.roiBasisLabel).toBe("ROI source basis was not stored.");
  });

  it("labels stored-empty execution mode separately from omitted mode (P-20)", () => {
    const emptyMode = buildRunDetailFirstScreenProofSummary({
      structuralExecutionMode: "",
      proofPackageCompleteness: {
        agentOutputPilotStrictEvidenceSatisfied: true,
      },
    });
    const omittedMode = buildRunDetailFirstScreenProofSummary({
      proofPackageCompleteness: {
        agentOutputPilotStrictEvidenceSatisfied: true,
      },
    });

    expect(emptyMode.executionModeLabel).toBe("Execution mode was stored empty.");
    expect(omittedMode.executionModeLabel).toBe("Execution mode was not stored.");
  });

  it("uses governed vocabulary when asserted transparency trail is empty (FC-13)", () => {
    const summary = buildRunDetailFirstScreenProofSummary(
      {
        governedFindingCoverage: {
          isAvailable: true,
          governedCount: 8,
          totalDecisionGradeCount: 10,
          governedPercentage: 80.0,
          advisoryCount: 2,
        },
      },
      { assertedTrailEmpty: true },
    );

    expect(summary.governedCoverageLabel).toBe("8 of 10 governed (80.0%)");
    expect(summary.governedCoverageLabel).not.toContain("evidence-backed");
  });
});
