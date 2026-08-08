import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedFindingsEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedFindingsEvidenceOrientationStrip";
import {
  ARCHITECTURE_CREATED_FINDINGS_CLAIM_DISCIPLINE,
  ARCHITECTURE_CREATED_FINDINGS_SOURCES_INTRO,
} from "@/lib/architecture-created-findings-sources";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

describe("ArchitectureCreatedFindingsEvidenceOrientationStrip", () => {
  it("renders help, Sources, and claim-discipline for create-home Findings", () => {
    render(<ArchitectureCreatedFindingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("architecture-created-findings-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-created-findings-sources")).toHaveTextContent(
      ARCHITECTURE_CREATED_FINDINGS_SOURCES_INTRO,
    );
    expect(screen.getByTestId("architecture-created-findings-claim-discipline")).toHaveTextContent(
      ARCHITECTURE_CREATED_FINDINGS_CLAIM_DISCIPLINE,
    );
  });
});
