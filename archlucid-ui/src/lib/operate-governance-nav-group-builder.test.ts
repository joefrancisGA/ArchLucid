import { describe, expect, it } from "vitest";

import { EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF } from "@/lib/executive/executive-dashboard-route";
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

  it("places Workspace health last in governance nav", () => {
    const group = new OperateGovernanceNavGroupBuilder().build();
    const lastLink = group.links[group.links.length - 1];

    expect(lastLink?.href).toBe(EXECUTIVE_DASHBOARD_WORKSPACE_HEALTH_HREF);
    expect(lastLink?.label).toBe("Workspace health");
  });
});
