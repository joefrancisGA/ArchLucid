import { describe, expect, it } from "vitest";

import { buildFindingModelProvenanceRow } from "@/lib/finding-model-provenance-display";

describe("buildFindingModelProvenanceRow", () => {
  it("prefers wire trustLabel for model row", () => {
    const row = buildFindingModelProvenanceRow({
      trustLabel: "RealModel",
      trustLabelReason: "Supported by retrieved evidence.",
      policyRuleId: "sec-base-001",
      evidenceRefCount: 2,
    });

    expect(row.origin).toBe("AI-generated");
    expect(row.grounding).toBe("Evidence-backed");
    expect(row.trustLabelReason).toBe("Supported by retrieved evidence.");
  });

  it("falls back to policy rule inference", () => {
    const row = buildFindingModelProvenanceRow({
      policyRuleId: "sec-base-001",
      evidenceRefCount: 0,
    });

    expect(row.origin).toBe("Deterministic rule");
    expect(row.grounding).toBe("Not applicable");
  });
});
