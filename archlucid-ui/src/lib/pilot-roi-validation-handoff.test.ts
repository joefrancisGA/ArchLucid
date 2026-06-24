import { describe, expect, it } from "vitest";

import type { PilotRunDeltasProofSummaryJson } from "@/lib/pilot-proof-readiness";
import {
  buildPilotRoiValidationChecklistMarkdown,
  resolvePilotRoiValidationVerdict,
} from "@/lib/pilot-roi-validation-handoff";

function payload(
  overrides: Partial<PilotRunDeltasProofSummaryJson> & {
    proofPackageCompleteness?: Partial<NonNullable<PilotRunDeltasProofSummaryJson["proofPackageCompleteness"]>>;
  } = {},
): PilotRunDeltasProofSummaryJson {
  const { proofPackageCompleteness, ...rest } = overrides;

  return {
    isDemoTenant: false,
    structuralExecutionMode: "Real",
    proofPackageCompleteness: {
      sponsorProofReadiness: "Sendable",
      proofSendability: "Sendable",
      roiEvidenceConfidence: "Strong",
      roiBaselineInputs: { projectedDollarClaimsSponsorSafe: true },
      agentOutputPilotStrictEvidenceSatisfied: true,
      ...proofPackageCompleteness,
    },
    ...rest,
  };
}

describe("resolvePilotRoiValidationVerdict", () => {
  it("returns sendable for Strong + Real + sponsor-safe dollar claims", () => {
    const result = resolvePilotRoiValidationVerdict(
      payload({ structuralExecutionMode: "Real" } as PilotRunDeltasProofSummaryJson),
    );

    expect(result.verdict).toBe("sendable");
    expect(result.headline).toContain("Safe to quote ROI externally");
  });

  it("returns hold when ROI confidence is Low", () => {
    const result = resolvePilotRoiValidationVerdict(
      payload({
        structuralExecutionMode: "Real",
        proofPackageCompleteness: { roiEvidenceConfidence: "Low" },
      }),
    );

    expect(result.verdict).toBe("hold");
  });

  it("returns hold when projected dollar claims are not sponsor-safe", () => {
    const result = resolvePilotRoiValidationVerdict(
      payload({
        structuralExecutionMode: "Real",
        proofPackageCompleteness: {
          roiEvidenceConfidence: "Strong",
          roiBaselineInputs: { projectedDollarClaimsSponsorSafe: false },
        },
      }),
    );

    expect(result.verdict).toBe("hold");
  });

  it("returns hold when execution mode is Simulator", () => {
    const result = resolvePilotRoiValidationVerdict(
      payload({ structuralExecutionMode: "Simulator" } as PilotRunDeltasProofSummaryJson),
    );

    expect(result.verdict).toBe("hold");
  });

  it("returns internal-only for Partial confidence on Real mode", () => {
    const result = resolvePilotRoiValidationVerdict(
      payload({
        proofPackageCompleteness: { roiEvidenceConfidence: "Partial" },
      }),
    );

    expect(result.verdict).toBe("internal-only");
  });

  it("returns hold when sponsor proof readiness is Incomplete", () => {
    const result = resolvePilotRoiValidationVerdict(
      payload({
        structuralExecutionMode: "Real",
        proofPackageCompleteness: { sponsorProofReadiness: "Incomplete", proofSendability: "NotSendable" },
      }),
    );

    expect(result.verdict).toBe("hold");
  });
});

describe("buildPilotRoiValidationChecklistMarkdown", () => {
  it("includes run id, confidence fields, and interview prompts", () => {
    const markdown = buildPilotRoiValidationChecklistMarkdown(
      "run-abc",
      payload({ structuralExecutionMode: "Real" } as PilotRunDeltasProofSummaryJson),
    );

    expect(markdown).toContain("Run ID: run-abc");
    expect(markdown).toContain("ROI evidence confidence: Strong");
    expect(markdown).toContain("Projected dollar claims sponsor-safe: yes");
    expect(markdown).toContain("Did a decision change because of a finding?");
    expect(markdown).toContain("paid-pilot-evidence-ledger.template.json");
  });
});
