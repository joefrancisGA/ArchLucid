import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureDiagramLegend } from "@/components/architecture/ArchitectureDiagramLegend";
import { ARCHITECTURE_DIAGRAM_PROVENANCE_MODEL_NOT_LOADED } from "@/lib/architecture/architecture-diagram-provenance";

describe("ArchitectureDiagramLegend", () => {
  it("shows omission copy when the diagram model is missing (P-12)", () => {
    render(<ArchitectureDiagramLegend model={null} />);

    expect(screen.getByTestId("architecture-diagram-legend-missing")).toHaveTextContent(
      ARCHITECTURE_DIAGRAM_PROVENANCE_MODEL_NOT_LOADED,
    );
  });
});
