import { describe, expect, it } from "vitest";

import { GOVERNANCE_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { OperateInfrastructureNavGroupBuilder } from "@/lib/operate-infrastructure-nav-group-builder";

describe("OperateInfrastructureNavGroupBuilder", () => {
  it("registers all infrastructure evidence hrefs under /governance/infrastructure", () => {
    const group = new OperateInfrastructureNavGroupBuilder().build();

    expect(group.id).toBe("operate-infrastructure");
    expect(group.label).toBe("Infrastructure");
    expect(group.links.map((link) => link.href)).toEqual([
      "/governance/infrastructure",
      "/governance/infrastructure/drift",
      "/governance/infrastructure/diagrams",
      "/governance/infrastructure/diagram-reconcile",
      "/governance/infrastructure/resources",
      "/governance/infrastructure/ask",
      "/governance/infrastructure/remediation",
    ]);

    for (const link of group.links) {
      expect(link.href.startsWith(`${GOVERNANCE_INFRASTRUCTURE_PATH}`)).toBe(true);
      expect(link.requiredAuthority).toBe("ReadAuthority");
    }
  });
});
