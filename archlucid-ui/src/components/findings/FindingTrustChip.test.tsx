import { describe, expect, it } from "vitest";

import { deriveFindingTrustChip } from "@/components/findings/FindingTrustChip";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function baseFinding(overrides: Partial<QuickDecisionFinding>): QuickDecisionFinding {
  return {
    findingId: "f-1",
    title: "Sample",
    recommendation: "Do something.",
    severityValue: 2,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    ...overrides,
  };
}

describe("deriveFindingTrustChip", () => {
  it("marks findings with evidence as AI-generated / evidence-backed", () => {
    const chip = deriveFindingTrustChip(
      baseFinding({ evidenceRefCount: 2, confidenceLevel: "High" }),
    );

    expect(chip.kind).toBe("evidence-backed");
    expect(chip.label).toBe("AI-generated");
    expect(chip.groundingLabel).toBe("Evidence-backed");
  });

  it("marks zero evidence as citation missing", () => {
    const chip = deriveFindingTrustChip(baseFinding({ evidenceRefCount: 0 }));

    expect(chip.kind).toBe("citation-missing");
    expect(chip.label).toBe("AI-generated");
    expect(chip.groundingLabel).toBe("Ungrounded");
    expect(chip.title).toContain("language model");
  });

  it("marks low confidence with evidence as estimated", () => {
    const chip = deriveFindingTrustChip(
      baseFinding({ evidenceRefCount: 1, confidenceLevel: "Low" }),
    );

    expect(chip.kind).toBe("low-confidence");
    expect(chip.label).toBe("AI-generated");
    expect(chip.groundingLabel).toBe("Estimated");
  });

  it("marks low confidence without evidence as heuristic", () => {
    const chip = deriveFindingTrustChip(
      baseFinding({ evidenceRefCount: 0, confidenceLevel: "Low" }),
    );

    expect(chip.kind).toBe("heuristic");
    expect(chip.label).toBe("AI-generated");
    expect(chip.groundingLabel).toBe("Ungrounded");
  });

  it("treats missing evidence count as citation missing", () => {
    const chip = deriveFindingTrustChip(baseFinding({ evidenceRefCount: null }));

    expect(chip.kind).toBe("citation-missing");
  });

  it("does not invent confidence when evidence exists but confidence is unknown", () => {
    const chip = deriveFindingTrustChip(
      baseFinding({ evidenceRefCount: 1, confidenceLevel: null }),
    );

    expect(chip.kind).toBe("evidence-backed");
    expect(chip.title).toContain("language model");
  });

  it("prefers wire trustLabel over policyRuleId inference and exposes source", () => {
    const chip = deriveFindingTrustChip(
      baseFinding({
        policyRuleId: "cis-az-001",
        trustLabel: "RealModel",
        evidenceRefCount: 2,
        confidenceLevel: "High",
      }),
    );

    expect(chip.kind).toBe("evidence-backed");
    expect(chip.trustSource).toBe("wire");
  });

  it("marks inferred policy-rule findings with inferred source", () => {
    const chip = deriveFindingTrustChip(
      baseFinding({ policyRuleId: "cis-az-001", evidenceRefCount: 0 }),
    );

    expect(chip.trustSource).toBe("inferred");
  });

  it("marks policy-rule findings as deterministic rule", () => {
    const chip = deriveFindingTrustChip(
      baseFinding({ policyRuleId: "cis-az-001", evidenceRefCount: 0 }),
    );

    expect(chip.kind).toBe("deterministic-rule");
    expect(chip.label).toBe("Deterministic rule");
    expect(chip.groundingLabel).toBe("Not applicable");
  });

  it("marks wire DeterministicFallback as a distinct fallback chip", () => {
    const chip = deriveFindingTrustChip(
      baseFinding({
        trustLabel: "DeterministicFallback",
        policyRuleId: "cis-az-001",
        evidenceRefCount: 2,
        confidenceLevel: "High",
      }),
    );

    expect(chip.kind).toBe("deterministic-fallback");
    expect(chip.label).toBe("Deterministic fallback");
    expect(chip.groundingLabel).toBe("Not applicable");
    expect(chip.title).toContain("verify independently");
    expect(chip.trustSource).toBe("wire");
  });

  it("marks simulator runs as simulated", () => {
    const chip = deriveFindingTrustChip(baseFinding({ evidenceRefCount: 2 }), {
      isSimulatorRun: true,
    });

    expect(chip.kind).toBe("simulator-derived");
    expect(chip.label).toBe("Simulated");
  });
});
