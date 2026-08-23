import { describe, expect, it } from "vitest";

import { OperatePolicyNavGroupBuilder } from "@/lib/operate-policy-nav-group-builder";

describe("OperatePolicyNavGroupBuilder", () => {
  it("labels the group Policy", () => {
    const group = new OperatePolicyNavGroupBuilder().build();

    expect(group.id).toBe("operate-policy");
    expect(group.label).toBe("Policy");
    expect(group.caption).toBe(
      "Configure policy packs, standards, alert rules, schedules, and approval setup.",
    );
  });

  it("includes Governance setup in policy nav (TB-520 / TB-1135)", () => {
    const group = new OperatePolicyNavGroupBuilder().build();
    const setupGuide = group.links.find((link) => link.href === "/governance/setup");

    expect(setupGuide).toBeDefined();
    expect(setupGuide?.label).toBe("Approval setup");
    expect(setupGuide?.title?.toLowerCase()).not.toContain("evaluation");
    expect(setupGuide?.title?.toLowerCase()).not.toContain("pilot");
  });

  it("lists policy configuration destinations in setup order", () => {
    const group = new OperatePolicyNavGroupBuilder().build();

    expect(group.links.map((link) => link.href)).toEqual([
      "/governance/policy-packs",
      "/governance/standards-and-rules",
      "/governance/alert-rules",
      "/governance/recurrence-schedules",
      "/governance/setup",
    ]);
  });
});
