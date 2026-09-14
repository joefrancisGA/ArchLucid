import { describe, expect, it } from "vitest";

import { render, screen } from "@testing-library/react";

import { InfraEvidenceDiagramOutlineNodeLabel } from "@/lib/infra-evidence/infra-evidence-diagram-outline-node-label";
import type { InfraEvidenceMermaidOutlineNode } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

function node(overrides: Partial<InfraEvidenceMermaidOutlineNode> = {}): InfraEvidenceMermaidOutlineNode {
  return {
    id: "n1",
    label: "core-vnet",
    resourceType: "Microsoft.Network/virtualNetworks",
    resourceGroup: "rg-network",
    ...overrides,
  };
}

describe("InfraEvidenceDiagramOutlineNodeLabel", () => {
  it("stacks a title-cased type caption under the resource name", () => {
    render(<InfraEvidenceDiagramOutlineNodeLabel node={node()} />);

    expect(screen.getByText("core-vnet")).toBeTruthy();
    expect(screen.getByText("(Virtual Network)")).toBeTruthy();
  });

  it("strips an inline parenthetical from the mermaid label when metadata is present", () => {
    render(
      <InfraEvidenceDiagramOutlineNodeLabel
        node={node({ label: "core-vnet (Virtual network)" })}
      />,
    );

    expect(screen.getByText("core-vnet")).toBeTruthy();
    expect(screen.getByText("(Virtual Network)")).toBeTruthy();
    expect(screen.queryByText("core-vnet (Virtual network)")).toBeNull();
  });
});
