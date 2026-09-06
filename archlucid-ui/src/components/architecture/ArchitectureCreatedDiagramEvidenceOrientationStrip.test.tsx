import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { ArchitectureCreatedDiagramEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedDiagramEvidenceOrientationStrip";
import { ARCHITECTURE_CREATED_DIAGRAM_SOURCES } from "@/lib/architecture/architecture-created-diagram-sources";

describe("ArchitectureCreatedDiagramEvidenceOrientationStrip", () => {
  it("lists follow-up Sources and claim discipline copy", () => {
    render(<ArchitectureCreatedDiagramEvidenceOrientationStrip />);

    expect(screen.getByTestId("architecture-diagram-sources")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-diagram-claim-discipline")).toBeInTheDocument();

    for (const link of ARCHITECTURE_CREATED_DIAGRAM_SOURCES) {
      expectFollowUpLink(screen, link, { rawLabel: true });
    }

    expect(screen.getByText(/not a finalized review record export trail/i)).toBeInTheDocument();
  });
});
