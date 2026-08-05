import { describe, expect, it } from "vitest";

import { OperateGovernanceNavGroupBuilder } from "@/lib/operate-governance-nav-group-builder";

describe("OperateGovernanceNavGroupBuilder", () => {
  it("labels /governance first link Approval queue (TB-526)", () => {
    const group = new OperateGovernanceNavGroupBuilder().build();
    const workflowLink = group.links[0];

    expect(workflowLink?.href).toBe("/governance/approval-queue");
    expect(workflowLink?.label).toBe("Approval queue");
  });

  it("includes Governance setup in governance nav (TB-520 / TB-1135)", () => {
    const group = new OperateGovernanceNavGroupBuilder().build();
    const setupGuide = group.links.find((link) => link.href === "/governance/setup");

    expect(setupGuide).toBeDefined();
    expect(setupGuide?.label).toBe("Governance setup");
    expect(setupGuide?.title?.toLowerCase()).not.toContain("evaluation");
    expect(setupGuide?.title?.toLowerCase()).not.toContain("pilot");
  });
});
