import { describe, expect, it } from "vitest";

import { governanceResolutionUsesShowcaseRuleRows } from "./governance-resolution-showcase";
import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

describe("governanceResolutionUsesShowcaseRuleRows", () => {
  it("returns true when compliance rule keys are empty", () => {
    const data: EffectiveGovernanceResolutionResult = {
      tenantId: "t1",
      workspaceId: "w1",
      projectId: "p1",
      effectiveContent: { complianceRuleKeys: [] },
      decisions: [],
      conflicts: [],
      notes: [],
    };

    expect(governanceResolutionUsesShowcaseRuleRows(data)).toBe(true);
    expect(governanceResolutionUsesShowcaseRuleRows(null)).toBe(true);
  });

  it("returns false when live compliance rule keys exist", () => {
    const data: EffectiveGovernanceResolutionResult = {
      tenantId: "t1",
      workspaceId: "w1",
      projectId: "p1",
      effectiveContent: { complianceRuleKeys: ["rule-a"] },
      decisions: [],
      conflicts: [],
      notes: [],
    };

    expect(governanceResolutionUsesShowcaseRuleRows(data)).toBe(false);
  });
});
