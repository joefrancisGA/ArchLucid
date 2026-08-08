import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedOverviewEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedOverviewEvidenceOrientationStrip";
import {
  ARCHITECTURE_CREATED_OVERVIEW_CLAIM_DISCIPLINE,
  ARCHITECTURE_CREATED_OVERVIEW_SOURCES_INTRO,
} from "@/lib/architecture-created-overview-sources";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

describe("ArchitectureCreatedOverviewEvidenceOrientationStrip", () => {
  it("renders help, Sources, and claim-discipline for create-home Overview", () => {
    render(<ArchitectureCreatedOverviewEvidenceOrientationStrip />);

    expect(screen.getByTestId("architecture-created-overview-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-created-overview-sources")).toHaveTextContent(
      ARCHITECTURE_CREATED_OVERVIEW_SOURCES_INTRO,
    );
    expect(screen.getByTestId("architecture-created-overview-claim-discipline")).toHaveTextContent(
      ARCHITECTURE_CREATED_OVERVIEW_CLAIM_DISCIPLINE,
    );
  });
});
