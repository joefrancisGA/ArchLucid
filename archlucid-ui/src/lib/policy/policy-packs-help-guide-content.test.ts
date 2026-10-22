import { describe, expect, it } from "vitest";

import {
  POLICY_PACKS_HELP_DIAGRAM_SOURCE,
  POLICY_PACKS_HELP_DIAGRAM_SUMMARY,
} from "@/lib/policy/policy-packs-help-guide-content";

describe("policy-packs-help-guide-content (TB-2126)", () => {
  it("ships a buyer-safe hierarchical merge diagram", () => {
    expect(POLICY_PACKS_HELP_DIAGRAM_SUMMARY.length).toBeGreaterThan(40);
    expect(POLICY_PACKS_HELP_DIAGRAM_SOURCE).toContain("flowchart TB");
    expect(POLICY_PACKS_HELP_DIAGRAM_SOURCE).toContain("Hierarchical merge");
    expect(POLICY_PACKS_HELP_DIAGRAM_SOURCE).not.toContain("ArchLucid");
    expect(POLICY_PACKS_HELP_DIAGRAM_SOURCE).not.toContain("EffectiveGovernance");
  });
});
