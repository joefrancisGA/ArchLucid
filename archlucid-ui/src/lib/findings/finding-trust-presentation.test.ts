import { describe, expect, it } from "vitest";

import {
  deriveFindingTrustPresentation,
  formatFindingTrustCompareDeltaLabels,
} from "@/lib/findings/finding-trust-presentation";

const FIXTURE_INFERRED_POLICY_RULE = {
  policyRuleId: "cis-az-001",
  evidenceRefCount: 0,
} as const;

const FIXTURE_WIRE_FALLBACK = {
  trustLabel: "DeterministicFallback",
  trustLabelReason: "Model path failed; fallback rule applied.",
  policyRuleId: "cis-az-001",
  evidenceRefCount: 2,
  confidenceLevel: "High",
} as const;

describe("deriveFindingTrustPresentation", () => {
  it("keeps inspect, compare-delta, and export chip sets aligned for inferred policy-rule findings", () => {
    const presentation = deriveFindingTrustPresentation(FIXTURE_INFERRED_POLICY_RULE);
    const compareDelta = formatFindingTrustCompareDeltaLabels(presentation.chipSet);

    expect(presentation.chipSet.label).toBe("Deterministic rule");
    expect(presentation.chipSet.groundingLabel).toBe("Not applicable");
    expect(presentation.chipSet.canonicalTrustLabel).toBe("DeterministicRule");
    expect(presentation.chipSet.trustSource).toBe("inferred");

    expect(presentation.inspectRow.origin).toBe(compareDelta.origin);
    expect(presentation.inspectRow.grounding).toBe(compareDelta.grounding);

    expect(presentation.export.canonicalTrustLabel).toBe("DeterministicRule");
    expect(presentation.export.exportLine).toBe("DeterministicRule");
    expect(presentation.export.jsonFields).toEqual({ trustLabel: "DeterministicRule" });
  });

  it("keeps inspect, compare-delta, and export aligned for wire DeterministicFallback", () => {
    const presentation = deriveFindingTrustPresentation(FIXTURE_WIRE_FALLBACK);
    const compareDelta = formatFindingTrustCompareDeltaLabels(presentation.chipSet);

    expect(presentation.chipSet.kind).toBe("deterministic-fallback");
    expect(presentation.chipSet.label).toBe("Deterministic fallback");
    expect(presentation.inspectRow.origin).toBe(compareDelta.origin);
    expect(presentation.inspectRow.grounding).toBe(compareDelta.grounding);
    expect(presentation.export.exportLine).toBe(
      "DeterministicFallback — Model path failed; fallback rule applied.",
    );
    expect(presentation.export.jsonFields).toEqual({
      trustLabel: "DeterministicFallback",
      trustLabelReason: "Model path failed; fallback rule applied.",
    });
  });

  it("does not invent export labels when inference would still resolve a canonical label", () => {
    const presentation = deriveFindingTrustPresentation({
      trustLabel: "  ",
      policyRuleId: "rule-1",
      evidenceRefCount: 0,
    });

    expect(presentation.export.exportLine).toBe("DeterministicRule");
    expect(presentation.chipSet.label).toBe("Deterministic rule");
  });
});
