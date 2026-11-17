import { describe, expect, it } from "vitest";

import { buildFindingModelProvenanceRow } from "@/lib/findings/finding-model-provenance-display";

describe("buildFindingModelProvenanceRow", () => {
  it("prefers wire trustLabel for model row", () => {
    const row = buildFindingModelProvenanceRow({
      trustLabel: "RealModel",
      trustLabelReason: "Supported by retrieved evidence.",
      policyRuleId: "sec-base-001",
      evidenceRefCount: 2,
    });

    expect(row.origin).toBe("RealModel");
    expect(row.grounding).toBe("Grounding was not stored.");
    expect(row.trustLabelReason).toBe("Supported by retrieved evidence.");
  });

  it("labels absent wire trust label without inferring policy rules", () => {
    const row = buildFindingModelProvenanceRow({
      policyRuleId: "sec-base-001",
      evidenceRefCount: 0,
    });

    expect(row.origin).toBe("Trust label was not stored");
    expect(row.grounding).toBe("Grounding was not stored.");
  });
});
