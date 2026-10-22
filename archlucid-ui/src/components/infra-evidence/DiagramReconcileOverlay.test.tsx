import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DiagramReconcileOverlay } from "@/components/infra-evidence/DiagramReconcileOverlay";
import type { DiagramInfrastructureCorrespondenceRow } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-types";

vi.mock("@/lib/mermaid/mermaid-safe-render", () => ({
  renderMermaidSvgMarkup: vi.fn(async () => '<svg xmlns="http://www.w3.org/2000/svg"><g class="node"><title>exact-node</title><rect /></g></svg>'),
}));

const rows: DiagramInfrastructureCorrespondenceRow[] = [
  {
    correspondenceId: "exact-1",
    diagramNodeId: "exact-node",
    diagramNodeLabel: "Exact gateway",
    cloudResourceId: null,
    azureResourceId: null,
    resourceType: null,
    resourceGroup: null,
    terraformAddress: null,
    matchKind: "Exact",
    confidenceBand: "Confirmed",
    explainText: "The node matches the inventory resource.",
    aiRationale: "This must not be displayed for an exact match.",
    securityDiscrepancy: false,
  },
  {
    correspondenceId: "possible-1",
    diagramNodeId: "possible-node",
    diagramNodeLabel: "Possible storage",
    cloudResourceId: null,
    azureResourceId: null,
    resourceType: null,
    resourceGroup: null,
    terraformAddress: null,
    matchKind: "Possible",
    confidenceBand: "Possible",
    explainText: "The node may refer to this resource.",
    aiRationale: "The labels are similar.",
    securityDiscrepancy: false,
  },
];

describe("DiagramReconcileOverlay", () => {
  it("renders per-node captions with the formatted row explanations", async () => {
    render(<DiagramReconcileOverlay source="flowchart TD" rows={rows} enabled />);

    const captions = screen.getByLabelText("Imported diagram match captions");
    const exactCaption = captions.querySelector('[data-diagram-node-id="exact-node"]');
    expect(exactCaption).toHaveAttribute("data-diagram-node-id", "exact-node");
    expect(exactCaption).toHaveTextContent("The node matches the inventory resource.");
    expect(exactCaption).not.toHaveTextContent("This must not be displayed");

    const possibleCaption = captions.querySelector('[data-diagram-node-id="possible-node"]');
    expect(possibleCaption).toHaveAttribute("data-diagram-node-id", "possible-node");
    expect(possibleCaption).toHaveTextContent("AI rationale: The labels are similar.");
    expect(await screen.findByTestId("infra-diagram-reconcile-overlay-svg")).toBeInTheDocument();
  });
});
