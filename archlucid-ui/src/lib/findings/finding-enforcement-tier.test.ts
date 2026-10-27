import { describe, expect, it } from "vitest";

import { findingEnforcementTierLabel, normalizeFindingEnforcementTier } from "./finding-enforcement-tier";

describe("finding-enforcement-tier", () => {
  it("preserves unexpected stored strings and distinguishes omission", () => {
    expect(normalizeFindingEnforcementTier("CustomTier")).toBe("CustomTier");
    expect(findingEnforcementTierLabel(normalizeFindingEnforcementTier("CustomTier"))).toBe("CustomTier");
    expect(normalizeFindingEnforcementTier(null)).toBeNull();
    expect(findingEnforcementTierLabel(normalizeFindingEnforcementTier(null))).toBe("Enforcement tier was not stored");
  });

  it("treats blank stored tier as omission", () => {
    expect(normalizeFindingEnforcementTier("   ")).toBeNull();
    expect(findingEnforcementTierLabel(normalizeFindingEnforcementTier("   "))).toBe(
      "Enforcement tier was not stored",
    );
  });

  it("labels Unknown enforcement tier tokens without treating them as a known band (P-14)", () => {
    expect(findingEnforcementTierLabel(normalizeFindingEnforcementTier("Unknown"))).toBe(
      "Enforcement tier Unknown has no reviewer label.",
    );
  });
});
