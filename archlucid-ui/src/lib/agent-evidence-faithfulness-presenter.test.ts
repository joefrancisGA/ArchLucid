import { describe, expect, it } from "vitest";

import {
  EVIDENCE_FAITHFULNESS_HEURISTIC_DISCLAIMER,
  evidenceFaithfulnessBadgePresentation,
  evidenceFaithfulnessTier,
} from "@/lib/agent-evidence-faithfulness-presenter";

describe("EVIDENCE_FAITHFULNESS_HEURISTIC_DISCLAIMER", () => {
  it("mentions heuristic and denies entailment", () => {
    expect(EVIDENCE_FAITHFULNESS_HEURISTIC_DISCLAIMER).toContain("deterministic");
    expect(EVIDENCE_FAITHFULNESS_HEURISTIC_DISCLAIMER.toLowerCase()).toContain("entailment");
  });
});

describe("evidenceFaithfulnessTier", () => {
  it("returns absent for nullish and NaN", () => {
    expect(evidenceFaithfulnessTier(null)).toBe("absent");
    expect(evidenceFaithfulnessTier(undefined)).toBe("absent");
    expect(evidenceFaithfulnessTier(Number.NaN)).toBe("absent");
  });

  it("returns absent for out-of-range or non-numeric strings", () => {
    expect(evidenceFaithfulnessTier(-0.1)).toBe("absent");
    expect(evidenceFaithfulnessTier(1.01)).toBe("absent");
    expect(evidenceFaithfulnessTier("nope")).toBe("absent");
  });

  it("coerces numeric strings from JSON", () => {
    expect(evidenceFaithfulnessTier("0.72")).toBe("strong");
  });

  it("classifies boundary tiers", () => {
    expect(evidenceFaithfulnessTier(0.65)).toBe("strong");
    expect(evidenceFaithfulnessTier(0.64)).toBe("moderate");
    expect(evidenceFaithfulnessTier(0.35)).toBe("moderate");
    expect(evidenceFaithfulnessTier(0.34)).toBe("weak");
    expect(evidenceFaithfulnessTier(0)).toBe("weak");
  });
});

describe("evidenceFaithfulnessBadgePresentation", () => {
  it("provides pill styling for strong tier", () => {
    const pres = evidenceFaithfulnessBadgePresentation(0.9);

    expect(pres.tier).toBe("strong");
    expect(pres.tierLabel).toBe("Strong");
    expect(pres.formattedRatio).toBe("0.90");
    expect(pres.badgeClassName).toContain("emerald");
  });

  it("clears label and ratio for absent", () => {
    const pres = evidenceFaithfulnessBadgePresentation(null);

    expect(pres.tier).toBe("absent");
    expect(pres.tierLabel).toBe("");
    expect(pres.formattedRatio).toBe("");
  });
});
