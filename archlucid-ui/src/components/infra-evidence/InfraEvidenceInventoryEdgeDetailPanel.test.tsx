import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InfraEvidenceInventoryEdgeDetailPanel } from "@/components/infra-evidence/InfraEvidenceInventoryEdgeDetailPanel";
import type { InfraEvidenceMermaidOutlineEdge } from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

function edge(inferenceSource: string): InfraEvidenceMermaidOutlineEdge {
  return {
    from: "a",
    to: "b",
    label: "Linked backend",
    source: "observed",
    confidenceBand: "observed",
    provenanceKind: "ObservedFact",
    inferenceSource,
    declaredConnectionId: null,
  };
}

describe("InfraEvidenceInventoryEdgeDetailPanel (P-15)", () => {
  it("shows app-settings hostname copy for storage host-ref edges", () => {
    render(
      <InfraEvidenceInventoryEdgeDetailPanel edge={edge("inventory-storage-host-ref")} onClose={() => undefined} />,
    );

    expect(screen.getByText(/read from app settings/i)).toBeInTheDocument();
  });

  it("shows route table configuration copy", () => {
    render(
      <InfraEvidenceInventoryEdgeDetailPanel edge={edge("inventory-route-table-route")} onClose={() => undefined} />,
    );

    expect(screen.getByText(/Route table next hop from configuration/)).toBeInTheDocument();
  });

  it("shows workflow action configuration copy", () => {
    render(
      <InfraEvidenceInventoryEdgeDetailPanel edge={edge("inventory-workflow-action")} onClose={() => undefined} />,
    );

    expect(screen.getByText(/workflow action target from configuration/i)).toBeInTheDocument();
  });

  it("shows relationship label and ObservedFact reader copy", () => {
    render(<InfraEvidenceInventoryEdgeDetailPanel edge={edge("inventory-custom-edge")} onClose={() => undefined} />);

    expect(screen.getByText("Linked backend")).toBeInTheDocument();
    expect(screen.getByText(/ObservedFact marks what inventory stored/i)).toBeInTheDocument();
  });

  it("shows configuration copy for aks service load balancer edges", () => {
    render(
      <InfraEvidenceInventoryEdgeDetailPanel edge={edge("inventory-aks-service-lb")} onClose={() => undefined} />,
    );

    expect(screen.getByText(/Kubernetes service load balancer in configuration/)).toBeInTheDocument();
    expect(screen.queryByText("inventory-aks-service-lb")).not.toBeInTheDocument();
  });

  it("shows configuration copy instead of inference slugs for static site backends", () => {
    render(
      <InfraEvidenceInventoryEdgeDetailPanel edge={edge("inventory-static-site-backend")} onClose={() => undefined} />,
    );

    expect(screen.getByText(/Static Web App linked backend in configuration/)).toBeInTheDocument();
    expect(screen.queryByText("inventory-static-site-backend")).not.toBeInTheDocument();
  });

  it("does not label an unclassified confidence band as Observed", () => {
    render(
      <InfraEvidenceInventoryEdgeDetailPanel
        edge={{
          ...edge("inventory-custom-edge"),
          confidenceBand: undefined,
        }}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText("Confidence band was not classified.")).toBeInTheDocument();
    expect(screen.queryByText(/^Observed$/)).not.toBeInTheDocument();
  });

  it("does not label observed band as Observed when ObservedFact provenance is missing (P-19)", () => {
    render(
      <InfraEvidenceInventoryEdgeDetailPanel
        edge={{
          ...edge("inventory-custom-edge"),
          provenanceKind: "",
          confidenceBand: "observed",
        }}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText("Observed band was stored; ObservedFact provenance was not stored.")).toBeInTheDocument();
    expect(screen.queryByText(/^Observed$/)).not.toBeInTheDocument();
  });

  it("labels stored empty provenance and inference source", () => {
    render(
      <InfraEvidenceInventoryEdgeDetailPanel
        edge={{
          ...edge("inventory-custom-edge"),
          provenanceKind: "",
          inferenceSource: "",
          confidenceBand: "observed",
        }}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText("Provenance was stored empty.")).toBeInTheDocument();
    expect(screen.getByText("Inference source was stored empty.")).toBeInTheDocument();
  });
});
