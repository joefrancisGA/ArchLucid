import { describe, expect, it } from "vitest";

import {
  POLICY_PACK_DELTA_DEMO_HELP_CANONICAL_PATH,
  POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE,
  POLICY_PACK_DELTA_DEMO_HELP_NARRATIVE_ARC,
  POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS,
  POLICY_PACK_DELTA_DEMO_HELP_SOURCES,
} from "@/lib/policy/policy-pack-delta-demo-help-guide-content";

describe("policy-pack-delta-demo-help-guide-content", () => {
  it("keeps primary CTAs on policy packs, standards-and-rules, and audit", () => {
    expect(POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openPolicyPacks.href).toBe("/governance/policy-packs");
    expect(POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openStandardsAndRules.href).toBe(
      "/governance/standards-and-rules",
    );
    expect(POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openAuditTrail.href).toBe("/governance/audit");
  });

  it("lists a four-beat narrative arc", () => {
    expect(POLICY_PACK_DELTA_DEMO_HELP_NARRATIVE_ARC).toHaveLength(4);
    expect(POLICY_PACK_DELTA_DEMO_HELP_NARRATIVE_ARC[2]?.toLowerCase()).toContain("dry-run");
  });

  it("lists Sources without a self-link to this topic", () => {
    expect(
      POLICY_PACK_DELTA_DEMO_HELP_SOURCES.some((link) => link.href === POLICY_PACK_DELTA_DEMO_HELP_CANONICAL_PATH),
    ).toBe(false);
    expect(POLICY_PACK_DELTA_DEMO_HELP_SOURCES.some((link) => link.href.includes("governance-approval"))).toBe(true);
  });

  it("states claim discipline without implying certification", () => {
    expect(POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("not certification");
    expect(POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE.toLowerCase()).not.toContain("cpa");
  });
});
