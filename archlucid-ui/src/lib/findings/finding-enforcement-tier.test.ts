import { describe, expect, it } from "vitest";

import { findingEnforcementTierLabel, normalizeFindingEnforcementTier } from "./finding-enforcement-tier";

describe("finding-enforcement-tier", () => {
  it("preserves unexpected stored strings and distinguishes omission", () => {
    expect(normalizeFindingEnforcementTier("CustomTier")).toBe("CustomTier");
    expect(findingEnforcementTierLabel(normalizeFindingEnforcementTier("CustomTier"))).toBe("CustomTier");
    expect(normalizeFindingEnforcementTier(null)).toBeNull();
    expect(findingEnforcementTierLabel(normalizeFindingEnforcementTier(null))).toBe("Enforcement tier was not stored");
  });
});
