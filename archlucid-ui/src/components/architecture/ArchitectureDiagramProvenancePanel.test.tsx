import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { ArchitectureDiagramProvenancePanel } from "@/components/architecture/ArchitectureDiagramProvenancePanel";
import type { ArchitectureDiagramElementKind } from "@/lib/architecture/architecture-diagram-provenance";
import type { ArchitectureDiagramModel } from "@/lib/architecture/architecture-diagram-types";

const model: ArchitectureDiagramModel = {
  nodes: [
    {
      id: "api",
      label: "API",
      kind: "system",
      provenance: "asserted",
      removed: false,
      accepted: false,
    },
    {
      id: "queue",
      label: "Queue",
      kind: "system",
      provenance: "inferred",
      removed: false,
      accepted: false,
    },
  ],
  edges: [
    {
      id: "edge_api_queue",
      sourceId: "api",
      targetId: "queue",
      label: "publish",
      provenance: "inferred",
      removed: false,
    },
  ],
  trustBoundaryLabels: [],
};

describe("ArchitectureDiagramProvenancePanel", () => {
  it("shows evidence-backed vs inferred chips for selected elements", () => {
    function Harness(): React.JSX.Element {
      const [selectedKind, setSelectedKind] = useState<ArchitectureDiagramElementKind | null>(null);
      const [selectedId, setSelectedId] = useState<string | null>(null);

      return (
        <ArchitectureDiagramProvenancePanel
          runId="run-1"
          model={model}
          diagramVersionSource={null}
          selectedKind={selectedKind}
          selectedId={selectedId}
          onSelect={(kind, id) => {
            setSelectedKind(kind);
            setSelectedId(id);
          }}
        />
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByTestId("architecture-diagram-select-node-api"));
    expect(screen.getByTestId("architecture-diagram-provenance-detail")).toHaveTextContent("Evidence-backed");
    expect(screen.getByTestId("architecture-diagram-provenance-source-link")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("architecture-diagram-select-node-queue"));
    expect(screen.getByTestId("architecture-diagram-provenance-detail")).toHaveTextContent("Inferred");
    expect(screen.queryByTestId("architecture-diagram-provenance-source-link")).toBeInTheDocument();
  });
});
