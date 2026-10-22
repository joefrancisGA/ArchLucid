import { describe, expect, it } from "vitest";

import {
  INFRA_EVIDENCE_MERMAID_ALWAYS_DISPOSE_COLLAPSE_KIND,
  resolveAlwaysExcludedMermaidCollapseEntries,
} from "@/lib/infra-evidence/infra-evidence-mermaid-collapse-report";

describe("resolveAlwaysExcludedMermaidCollapseEntries", () => {
  it("returns only always-dispose collapse entries", () => {
    const entries = resolveAlwaysExcludedMermaidCollapseEntries({
      entries: [
        {
          kind: INFRA_EVIDENCE_MERMAID_ALWAYS_DISPOSE_COLLAPSE_KIND,
          cloudResourceId: null,
          nodeId: null,
          reason: "Always dispose — never shown on inventory diagrams: Microsoft.Network/dnszones",
        },
        {
          kind: "PeelBudgetArmType",
          cloudResourceId: null,
          nodeId: null,
          reason: "Hidden to fit readability thresholds (catalog v3): Microsoft.Network/networkInterfaces",
        },
      ],
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]?.reason).toContain("dnszones");
  });
});
