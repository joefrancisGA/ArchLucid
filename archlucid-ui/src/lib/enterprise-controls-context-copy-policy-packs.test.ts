import { describe, expect, it } from "vitest";

import {
  policyPacksEnforcementBoundaryLine,
  policyPacksOutcomeBannerLine,
} from "@/lib/enterprise-controls-context-copy-policy-packs";

describe("enterprise-controls-context-copy-policy-packs", () => {
  it("keeps enforcement-boundary outcome copy readable (no garbled finalization fragment)", () => {
    expect(policyPacksOutcomeBannerLine).not.toMatch(/finalizatio\s*—\s*ot/i);
    expect(policyPacksOutcomeBannerLine).toContain("finalization");
    expect(policyPacksOutcomeBannerLine).toContain("not from toggles on this page alone");
  });

  it("states enforcement boundary without demo moat language", () => {
    expect(policyPacksEnforcementBoundaryLine.toLowerCase()).not.toContain("moat");
    expect(policyPacksEnforcementBoundaryLine).toContain("merged policy");
  });
});
