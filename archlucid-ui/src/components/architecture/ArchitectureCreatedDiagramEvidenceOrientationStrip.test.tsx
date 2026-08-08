import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedDiagramEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedDiagramEvidenceOrientationStrip";
import {
  ARCHITECTURE_CREATED_DIAGRAM_CLAIM_DISCIPLINE,
  ARCHITECTURE_CREATED_DIAGRAM_SOURCES_INTRO,
} from "@/lib/architecture-created-diagram-sources";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

describe("ArchitectureCreatedDiagramEvidenceOrientationStrip", () => {
  it("renders help, Sources, and claim-discipline for create-home Diagram", () => {
    render(<ArchitectureCreatedDiagramEvidenceOrientationStrip />);

    expect(screen.getByTestId("architecture-created-diagram-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-created-diagram-sources")).toHaveTextContent(
      ARCHITECTURE_CREATED_DIAGRAM_SOURCES_INTRO,
    );
    expect(screen.getByTestId("architecture-created-diagram-claim-discipline")).toHaveTextContent(
      ARCHITECTURE_CREATED_DIAGRAM_CLAIM_DISCIPLINE,
    );
  });
});
