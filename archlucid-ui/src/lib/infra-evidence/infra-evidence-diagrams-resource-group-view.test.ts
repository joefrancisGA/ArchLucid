import { describe, expect, it } from "vitest";

import {
  buildInfraDiagramsResourceGroupModeToken,
  isInfraDiagramsResourceGroupMode,
  isInfraEvidenceResourceGroupMapMermaid,
  parseInfraDiagramsResourceGroupName,
} from "@/lib/infra-evidence/infra-evidence-diagrams-resource-group-view";

describe("infra-evidence-diagrams-resource-group-view", () => {
  it("parses picker keys, prefixed keys, and raw resource group names", () => {
    expect(isInfraDiagramsResourceGroupMode("resourceGroup")).toBe(true);
    expect(parseInfraDiagramsResourceGroupName("resourceGroup:rg-net")).toBe("rg-net");
    expect(parseInfraDiagramsResourceGroupName("rg-net")).toBe("rg-net");
    expect(parseInfraDiagramsResourceGroupName("executive")).toBe("");
    expect(parseInfraDiagramsResourceGroupName("full-machine")).toBe("");
    expect(buildInfraDiagramsResourceGroupModeToken("rg-net")).toBe("resourceGroup:rg-net");
    expect(buildInfraDiagramsResourceGroupModeToken("")).toBe("resourceGroup");
  });

  it("detects the resource group map mermaid marker", () => {
    expect(
      isInfraEvidenceResourceGroupMapMermaid("flowchart TD\n    %% al-view=resource-group-map\n    n1[\"rg-a\"]"),
    ).toBe(true);
    expect(isInfraEvidenceResourceGroupMapMermaid("flowchart TD\n    n1[\"vnet\"]")).toBe(false);
  });
});
