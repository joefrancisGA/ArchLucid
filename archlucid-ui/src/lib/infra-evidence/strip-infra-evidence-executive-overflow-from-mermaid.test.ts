import { describe, expect, it } from "vitest";

import {
  isInfraEvidenceExecutiveOverflowOutlineNode,
  stripExecutiveOverflowNodesFromInfraEvidenceMermaid,
} from "@/lib/infra-evidence/strip-infra-evidence-executive-overflow-from-mermaid";

describe("stripExecutiveOverflowNodesFromInfraEvidenceMermaid", () => {
  it("removes executive overflow rollup nodes and their edges from display mermaid", () => {
    const source = `flowchart TD
    executive_overflow_storage["+22 more storage accounts"]
    executive_overflow_workloads["+13 more compute workloads"]
    core_vnet["core-vnet"]
    core_vnet --> app_storage`;

    const stripped = stripExecutiveOverflowNodesFromInfraEvidenceMermaid(source);

    expect(stripped).not.toContain("+22 more storage accounts");
    expect(stripped).not.toContain("+13 more compute workloads");
    expect(stripped).toContain('core_vnet["core-vnet"]');
    expect(stripped).toContain("core_vnet --> app_storage");
  });

  it("leaves non-overflow mermaid unchanged", () => {
    const source = `flowchart TD
    core_vnet["core-vnet"]
    app_storage["app-storage"]`;

    expect(stripExecutiveOverflowNodesFromInfraEvidenceMermaid(source)).toBe(source);
  });
});

describe("isInfraEvidenceExecutiveOverflowOutlineNode", () => {
  it("matches executive rollup labels only", () => {
    expect(
      isInfraEvidenceExecutiveOverflowOutlineNode({
        id: "executive_overflow_storage",
        label: "+22 more storage accounts",
        resourceType: null,
        resourceGroup: null,
      }),
    ).toBe(true);

    expect(
      isInfraEvidenceExecutiveOverflowOutlineNode({
        id: "core_vnet",
        label: "core-vnet",
        resourceType: "Microsoft.Network/virtualNetworks",
        resourceGroup: "rg-net",
      }),
    ).toBe(false);
  });
});
