import { describe, expect, it } from "vitest";

import { resolveInfraEvidenceDiagramOutlineResourceName } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-outline-resource-name";
import type { InfraEvidenceMermaidOutlineNode } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

function node(label: string, resourceType: string | null = null): InfraEvidenceMermaidOutlineNode {
  return {
    id: "n1",
    label,
    resourceType,
    resourceGroup: null,
    connectionState: null,
  };
}

describe("resolveInfraEvidenceDiagramOutlineResourceName (P-02)", () => {
  it("labels empty and em-dash names as not stored", () => {
    expect(resolveInfraEvidenceDiagramOutlineResourceName(node(""))).toBe("Node name was not stored");
    expect(resolveInfraEvidenceDiagramOutlineResourceName(node("—"))).toBe("Node name was not stored");
  });

  it("lowercases a stored resource name", () => {
    expect(resolveInfraEvidenceDiagramOutlineResourceName(node("Gateway-PIP"))).toBe("gateway-pip");
  });
});
