import { describe, expect, it } from "vitest";

import { GOVERNANCE_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { OperateInfrastructureNavGroupBuilder } from "@/lib/operate-infrastructure-nav-group-builder";

describe("OperateInfrastructureNavGroupBuilder", () => {
  it("registers all infrastructure evidence hrefs under /governance/infrastructure", () => {
    const group = new OperateInfrastructureNavGroupBuilder().build();

    expect(group.id).toBe("operate-infrastructure");
    expect(group.label).toBe("Infrastructure");
    expect(group.links.map((link) => link.href)).toEqual([
      "/governance/infrastructure",
      "/governance/infrastructure/extract-upload",
      "/governance/infrastructure/drift",
      "/governance/infrastructure/terraform",
      "/governance/infrastructure/diagrams",
      "/governance/infrastructure/diagram-reconcile",
      "/governance/infrastructure/resources",
      "/governance/infrastructure/ask",
      "/governance/infrastructure/remediation",
    ]);

    for (const link of group.links) {
      expect(link.href.startsWith(`${GOVERNANCE_INFRASTRUCTURE_PATH}`)).toBe(true);
    }

    const extractUpload = group.links.find((link) => link.href === "/governance/infrastructure/extract-upload");

    expect(extractUpload).toBeDefined();
    expect(extractUpload?.label).toBe(OPERATOR_NAV_LINK_LABELS.extractUpload);
    expect(extractUpload?.requiredAuthority).toBe("ExecuteAuthority");

    const readAuthorityLinks = group.links.filter((link) => link.href !== "/governance/infrastructure/extract-upload");

    for (const link of readAuthorityLinks) {
      expect(link.requiredAuthority).toBe("ReadAuthority");
    }
  });
});
