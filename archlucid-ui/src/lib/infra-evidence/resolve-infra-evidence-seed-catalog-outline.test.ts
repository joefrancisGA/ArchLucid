import { describe, expect, it } from "vitest";

import { isInfraEvidenceExecutiveOverflowOutlineNode } from "@/lib/infra-evidence/strip-infra-evidence-executive-overflow-from-mermaid";
import { resolveInfraEvidenceSeedCatalogOutlineFromExecutiveMermaid } from "@/lib/infra-evidence/resolve-infra-evidence-seed-catalog-outline";

describe("resolveInfraEvidenceSeedCatalogOutlineFromExecutiveMermaid", () => {
  it("strips executive overflow rollup nodes before parsing the seed catalog outline", () => {
    const source = `flowchart TD
    executive_overflow_storage["+22 more storage accounts"]
    core_vnet["core-vnet"]
    core_vnet --> app_storage`;

    const outline = resolveInfraEvidenceSeedCatalogOutlineFromExecutiveMermaid(source);

    expect(outline).not.toBeNull();
    expect(
      outline?.nodes.some((node) => isInfraEvidenceExecutiveOverflowOutlineNode(node)),
    ).toBe(false);
    expect(outline?.nodes.map((node) => node.id)).toContain("core_vnet");
  });

  it("normalizes edge labels to match display mermaid before outline parse", () => {
    const source = 'flowchart LR\n  a -->|"May access MyStorageAcct"| b';
    const outline = resolveInfraEvidenceSeedCatalogOutlineFromExecutiveMermaid(source);

    expect(outline?.edges[0]?.label).toBe("may access mystorageacct");
  });
});
