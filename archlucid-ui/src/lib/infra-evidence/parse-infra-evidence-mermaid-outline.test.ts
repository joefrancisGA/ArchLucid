import { describe, expect, it } from "vitest";

import { parseInfraEvidenceMermaidOutline } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

describe("parseInfraEvidenceMermaidOutline", () => {
  it("skips subgraph and end structure lines", () => {
    const source = [
      "flowchart TD",
      "    subgraph rg1[\"RG network\"]",
      "        vnet1[\"vnet-eastus\"]",
      "    end",
      "    subgraph rg2[\"RG data\"]",
      "        vnet2[\"vnet-westus\"]",
      "    end",
    ].join("\n");

    const outline = parseInfraEvidenceMermaidOutline(source);

    expect(outline.nodes.map((node) => node.id)).toEqual(["vnet1", "vnet2"]);
    expect(outline.nodes.map((node) => node.label)).toEqual(["vnet-eastus", "vnet-westus"]);
  });
});
