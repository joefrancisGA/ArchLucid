import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedClarificationsEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedClarificationsEvidenceOrientationStrip";
import {
  ARCHITECTURE_CREATED_CLARIFICATIONS_CLAIM_DISCIPLINE,
  ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES_INTRO,
} from "@/lib/architecture-created-clarifications-sources";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

describe("ArchitectureCreatedClarificationsEvidenceOrientationStrip", () => {
  it("renders help, Sources, and claim-discipline for create-home Clarifications", () => {
    render(<ArchitectureCreatedClarificationsEvidenceOrientationStrip />);

    expect(screen.getByTestId("architecture-created-clarifications-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-created-clarifications-sources")).toHaveTextContent(
      ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES_INTRO,
    );
    expect(screen.getByTestId("architecture-created-clarifications-claim-discipline")).toHaveTextContent(
      ARCHITECTURE_CREATED_CLARIFICATIONS_CLAIM_DISCIPLINE,
    );
  });
});
