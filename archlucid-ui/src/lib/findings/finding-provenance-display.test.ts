import { describe, expect, it } from "vitest";

import {
  aggregateFindingProvenance,
  deriveFindingTrustLabelName,
  formatFindingProvenanceAggregateLine,
  mapFindingTrustLabelToProvenance,
  normalizeFindingTrustLabelName,
  type FindingTrustLabelName,
  FINDING_PROVENANCE_ORIGIN_EXPLANATIONS,
} from "@/lib/finding-provenance-display";

const ALL_LABELS: readonly FindingTrustLabelName[] = [
  "EvidenceBacked",
  "Estimated",
  "Heuristic",
  "SimulatorDerived",
  "RealModel",
  "Degraded",
  "MissingCitation",
  "DeterministicFallback",
  "DeterministicRule",
] as const;

describe("mapFindingTrustLabelToProvenance", () => {
  it.each([
    ["DeterministicFallback", "Deterministic fallback", "Not applicable"],
    ["DeterministicRule", "Deterministic rule", "Not applicable"],
    ["RealModel", "AI-generated", "Evidence-backed"],
    ["EvidenceBacked", "AI-generated", "Evidence-backed"],
    ["Estimated", "AI-generated", "Estimated"],
    ["Heuristic", "AI-generated", "Ungrounded"],
    ["Degraded", "AI-generated", "Degraded"],
    ["SimulatorDerived", "Simulated", "Not applicable"],
    ["MissingCitation", "AI-generated", "Ungrounded"],
  ] as const)("maps %s → %s / %s", (label, origin, grounding) => {
    expect(mapFindingTrustLabelToProvenance(label)).toEqual({ origin, grounding });
  });

  it("covers every FindingTrustLabel name", () => {
    expect(ALL_LABELS).toHaveLength(9);

    for (const label of ALL_LABELS) {
      const display = mapFindingTrustLabelToProvenance(label);
      expect(display.origin.length).toBeGreaterThan(0);
      expect(display.grounding.length).toBeGreaterThan(0);
      expect(FINDING_PROVENANCE_ORIGIN_EXPLANATIONS[display.origin].length).toBeGreaterThan(0);
    }
  });
});

describe("normalizeFindingTrustLabelName", () => {
  it("accepts PascalCase and kebab-case wire forms", () => {
    expect(normalizeFindingTrustLabelName("EvidenceBacked")).toBe("EvidenceBacked");
    expect(normalizeFindingTrustLabelName("evidence-backed")).toBe("EvidenceBacked");
    expect(normalizeFindingTrustLabelName("deterministic_fallback")).toBe("DeterministicFallback");
  });

  it("returns null for unknown values", () => {
    expect(normalizeFindingTrustLabelName("")).toBeNull();
    expect(normalizeFindingTrustLabelName("not-a-label")).toBeNull();
    expect(normalizeFindingTrustLabelName(null)).toBeNull();
  });
});

describe("deriveFindingTrustLabelName", () => {
  it("prefers an explicit trust label", () => {
    expect(
      deriveFindingTrustLabelName({
        trustLabel: "RealModel",
        policyRuleId: "rule-1",
        evidenceRefCount: 0,
      }),
    ).toBe("RealModel");
  });

  it("infers deterministic when a policy rule id is present", () => {
    expect(deriveFindingTrustLabelName({ policyRuleId: "cis-az-001" })).toBe("DeterministicRule");
  });

  it("infers simulator when the parent review is simulator-mode", () => {
    expect(deriveFindingTrustLabelName({ isSimulatorRun: true, evidenceRefCount: 2 })).toBe(
      "SimulatorDerived",
    );
  });

  it("infers grounding from evidence and confidence", () => {
    expect(deriveFindingTrustLabelName({ evidenceRefCount: 2, confidenceLevel: "High" })).toBe(
      "EvidenceBacked",
    );
    expect(deriveFindingTrustLabelName({ evidenceRefCount: 1, confidenceLevel: "Low" })).toBe(
      "Estimated",
    );
    expect(deriveFindingTrustLabelName({ evidenceRefCount: 0, confidenceLevel: "Low" })).toBe(
      "Heuristic",
    );
    expect(deriveFindingTrustLabelName({ evidenceRefCount: 0 })).toBe("MissingCitation");
  });
});

describe("aggregateFindingProvenance", () => {
  it("formats a quiet scorecard line", () => {
    const counts = aggregateFindingProvenance([
      { policyRuleId: "r1" },
      { policyRuleId: "r2" },
      { evidenceRefCount: 2, confidenceLevel: "High" },
      { evidenceRefCount: 1, confidenceLevel: "High" },
      { evidenceRefCount: 0, confidenceLevel: "Low" },
    ]);

    expect(counts).toEqual({
      total: 5,
      deterministicRule: 2,
      deterministicFallback: 0,
      aiGenerated: 3,
      aiEvidenceBacked: 2,
      simulated: 0,
    });
    expect(formatFindingProvenanceAggregateLine(counts)).toBe(
      "5 findings — 2 from deterministic rules, 3 AI-generated (2 evidence-backed)",
    );
  });

  it("returns null for an empty aggregate", () => {
    expect(formatFindingProvenanceAggregateLine(aggregateFindingProvenance([]))).toBeNull();
  });

  it("counts deterministic fallback separately from policy rules", () => {
    const counts = aggregateFindingProvenance([
      { policyRuleId: "r1" },
      { trustLabel: "DeterministicFallback" },
    ]);

    expect(counts).toEqual({
      total: 2,
      deterministicRule: 1,
      deterministicFallback: 1,
      aiGenerated: 0,
      aiEvidenceBacked: 0,
      simulated: 0,
    });
    expect(formatFindingProvenanceAggregateLine(counts)).toBe(
      "2 findings — 1 from deterministic rule, 1 deterministic fallback",
    );
  });
});
