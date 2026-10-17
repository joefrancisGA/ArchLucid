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
  it("shows configuration copy instead of inference slugs for static site backends", () => {
    render(
      <InfraEvidenceInventoryEdgeDetailPanel edge={edge("inventory-static-site-backend")} onClose={() => undefined} />,
    );

    expect(screen.getByText(/Static Web App linked backend in configuration/)).toBeInTheDocument();
    expect(screen.queryByText("inventory-static-site-backend")).not.toBeInTheDocument();
  });
});
