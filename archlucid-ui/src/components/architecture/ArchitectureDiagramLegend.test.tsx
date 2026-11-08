import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureDiagramLegend } from "@/components/architecture/ArchitectureDiagramLegend";
import { ARCHITECTURE_DIAGRAM_LEGEND_INFERRED_LINE } from "@/lib/architecture/architecture-diagram-copy";
import { ARCHITECTURE_DIAGRAM_PROVENANCE_MODEL_NOT_LOADED } from "@/lib/architecture/architecture-diagram-provenance";
import type { ArchitectureDiagramModel } from "@/lib/architecture/architecture-diagram-types";

describe("ArchitectureDiagramLegend", () => {
  it("shows omission copy when the diagram model is missing (P-12)", () => {
    render(<ArchitectureDiagramLegend model={null} />);

    expect(screen.getByTestId("architecture-diagram-legend-missing")).toHaveTextContent(
      ARCHITECTURE_DIAGRAM_PROVENANCE_MODEL_NOT_LOADED,
    );
  });

  it("includes an explicit inferred connector line row (P-01)", () => {
    const model: ArchitectureDiagramModel = {
      nodes: [
        {
          id: "n1",
          label: "API",
          kind: "system",
          provenance: "inferred",
          removed: false,
          accepted: false,
        },
      ],
      edges: [
        {
          id: "e1",
          sourceId: "n1",
          targetId: "n2",
          label: "calls",
          provenance: "inferred",
          removed: false,
        },
      ],
      trustBoundaryLabels: [],
      skippedUnlabeledEntityCount: 0,
      unmatchedDataFlows: [],
      entitySectionHonestyLines: [],
    };

    render(<ArchitectureDiagramLegend model={model} />);

    expect(screen.getByTestId("architecture-diagram-legend-inferred-line")).toHaveTextContent(
      ARCHITECTURE_DIAGRAM_LEGEND_INFERRED_LINE,
    );
  });

  it("shows edge-only provenance copy when lines exist without components (P-01)", () => {
    const model: ArchitectureDiagramModel = {
      nodes: [],
      edges: [
        {
          id: "e1",
          sourceId: "missing-a",
          targetId: "missing-b",
          label: "calls",
          provenance: "asserted",
          removed: false,
        },
      ],
      trustBoundaryLabels: [],
      skippedUnlabeledEntityCount: 0,
      unmatchedDataFlows: [],
      entitySectionHonestyLines: [],
    };

    render(<ArchitectureDiagramLegend model={model} />);

    expect(screen.getByTestId("architecture-diagram-legend-edges-only")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-diagram-legend-empty")).not.toBeInTheDocument();
  });
});
