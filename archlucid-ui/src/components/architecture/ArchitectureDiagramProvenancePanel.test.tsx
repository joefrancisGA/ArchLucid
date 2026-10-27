import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { ArchitectureDiagramProvenancePanel } from "@/components/architecture/ArchitectureDiagramProvenancePanel";
import {
  ARCHITECTURE_DIAGRAM_EVIDENCE_ITEM_ID_NOT_STORED_ON_COMPONENT,
  ARCHITECTURE_DIAGRAM_REVIEW_ID_NOT_STORED_EVIDENCE_LINK,
  type ArchitectureDiagramElementKind,
} from "@/lib/architecture/architecture-diagram-provenance";
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
  skippedUnlabeledEntityCount: 0,
  unmatchedDataFlows: [],
};

describe("ArchitectureDiagramProvenancePanel", () => {
  it("shows brief-asserted vs inferred chips for selected elements", () => {
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
    expect(screen.getByTestId("architecture-diagram-provenance-detail")).toHaveTextContent("Asserted in brief");
    expect(screen.getByTestId("architecture-diagram-provenance-missing-review-id")).toHaveTextContent(
      ARCHITECTURE_DIAGRAM_EVIDENCE_ITEM_ID_NOT_STORED_ON_COMPONENT,
    );
    expect(screen.queryByTestId("architecture-diagram-provenance-source-link")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("architecture-diagram-select-node-queue"));
    expect(screen.getByTestId("architecture-diagram-provenance-detail")).toHaveTextContent("Inferred");
    expect(screen.getByTestId("architecture-diagram-provenance-detail")).toHaveTextContent(
      "Inferred items do not include a source evidence link.",
    );
    expect(screen.queryByTestId("architecture-diagram-provenance-missing-review-id")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-diagram-provenance-source-link")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-diagram-provenance-missing-review-id")).not.toBeInTheDocument();
  });

  it("explains a missing review id when the panel has no stored run id", () => {
    render(
      <ArchitectureDiagramProvenancePanel
        runId=""
        model={model}
        diagramVersionSource={null}
        selectedKind="node"
        selectedId="api"
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByTestId("architecture-diagram-provenance-missing-review-id")).toHaveTextContent(
      ARCHITECTURE_DIAGRAM_REVIEW_ID_NOT_STORED_EVIDENCE_LINK,
    );
  });
});
