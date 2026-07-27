import { describe, expect, it } from "vitest";

import { OperateGovernanceNavGroupBuilder } from "@/lib/operate-governance-nav-group-builder";
import { OperateReportsNavGroupBuilder } from "@/lib/operate-reports-nav-group-builder";

describe("OperateGovernanceNavGroupBuilder", () => {
  it("labels /governance first link Approval queue (TB-526)", () => {
    const group = new OperateGovernanceNavGroupBuilder().build();
    const workflowLink = group.links[0];

    expect(workflowLink?.href).toBe("/governance");
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

describe("OperateReportsNavGroupBuilder", () => {
  it("omits governance setup link from reports nav (TB-520)", () => {
    const group = new OperateReportsNavGroupBuilder().build();

    expect(group.links.some((link) => link.href === "/governance/setup")).toBe(false);
    expect(group.links.map((link) => link.label)).not.toContain("First 30 days (governance)");
  });

  it("does not duplicate Architecture scorecard after Insights promotion", () => {
    const group = new OperateReportsNavGroupBuilder().build();

    expect(group.links.some((link) => link.href === "/scorecard")).toBe(false);
    expect(group.links.some((link) => link.href === "/sponsor-report/architecture-scorecard")).toBe(
      false,
    );
    expect(group.links.map((link) => link.label)).not.toContain("Architecture scorecard");
  });
});
