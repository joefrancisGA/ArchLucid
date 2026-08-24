import { describe, expect, it } from "vitest";

import { OperateGovernanceNavGroupBuilder } from "@/lib/operate-governance-nav-group-builder";

describe("OperateGovernanceNavGroupBuilder", () => {
  it("labels /governance first link Approval queue (TB-526)", () => {
    const group = new OperateGovernanceNavGroupBuilder().build();
    const workflowLink = group.links[0];

    expect(workflowLink?.href).toBe("/governance/approval-queue");
    expect(workflowLink?.label).toBe("Approval queue");
  });

  it("includes Approval setup in Approval nav (TB-520 / TB-1135)", () => {
    const group = new OperateGovernanceNavGroupBuilder().build();
    const setupGuide = group.links.find((link) => link.href === "/governance/setup");

    expect(setupGuide).toBeDefined();
    expect(setupGuide?.label).toBe("Approval setup");
    expect(setupGuide?.title?.toLowerCase()).not.toContain("evaluation");
    expect(setupGuide?.title?.toLowerCase()).not.toContain("pilot");
  });

  it("keeps the decide-and-track loop in Approval nav", () => {
    const group = new OperateGovernanceNavGroupBuilder().build();

    expect(group.links.map((link) => link.href)).toEqual([
      "/governance/approval-queue",
      "/governance/setup",
      "/governance/findings",
      "/governance/findings/assigned-to-me",
      "/governance/exceptions",
      "/governance/decision-register",
      "/governance/sealed-records",
      "/governance/advisory-scans",
      "/governance/audit",
      "/governance/alerts",
    ]);
    expect(group.caption).toBe(
      "Approve findings, track exceptions and decisions, and monitor audit trail and alerts.",
    );
    expect(group.links.some((link) => link.href === "/governance/policy-packs")).toBe(false);
  });
});
