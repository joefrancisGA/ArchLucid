import { describe, expect, it } from "vitest";

import { OperatePolicyNavGroupBuilder } from "@/lib/operate-policy-nav-group-builder";

describe("OperatePolicyNavGroupBuilder", () => {
  it("labels the group Policy", () => {
    const group = new OperatePolicyNavGroupBuilder().build();

    expect(group.id).toBe("operate-policy");
    expect(group.label).toBe("Policy");
    expect(group.caption).toBe(
      "Configure policy packs, standards, alert rules, and recurrence schedules.",
    );
  });

  it("lists policy configuration destinations in setup order", () => {
    const group = new OperatePolicyNavGroupBuilder().build();

    expect(group.links.map((link) => link.href)).toEqual([
      "/governance/policy-packs",
      "/governance/standards-and-rules",
      "/governance/alert-rules",
      "/governance/recurrence-schedules",
    ]);
  });
});
