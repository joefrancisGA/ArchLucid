import { describe, expect, it } from "vitest";

import { OperateGovernanceNavGroupBuilder } from "@/lib/operate-governance-nav-group-builder";

describe("OperateGovernanceNavGroupBuilder", () => {
  it("labels /governance first link Approval queue (TB-526)", () => {
    const group = new OperateGovernanceNavGroupBuilder().build();
    const workflowLink = group.links[0];

    expect(workflowLink?.href).toBe("/governance/approval-queue");
    expect(workflowLink?.label).toBe("Approval queue");
  });

  it("keeps the decide-and-track loop only in Approval nav", () => {
    const group = new OperateGovernanceNavGroupBuilder().build();

    expect(group.links.map((link) => link.href)).toEqual([
      "/governance/approval-queue",
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
    expect(group.links.some((link) => link.href === "/governance/setup")).toBe(false);
  });
});
