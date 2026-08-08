import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedEvidenceOrientationStrip";
import {
  ARCHITECTURE_CREATED_EVIDENCE_CLAIM_DISCIPLINE,
  ARCHITECTURE_CREATED_EVIDENCE_SOURCES_INTRO,
} from "@/lib/architecture-created-evidence-sources";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

describe("ArchitectureCreatedEvidenceOrientationStrip", () => {
  it("renders help, Sources, and claim-discipline for create-home Evidence", () => {
    render(<ArchitectureCreatedEvidenceOrientationStrip />);

    expect(screen.getByTestId("architecture-created-evidence-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-created-evidence-sources")).toHaveTextContent(
      ARCHITECTURE_CREATED_EVIDENCE_SOURCES_INTRO,
    );
    expect(screen.getByTestId("architecture-created-evidence-claim-discipline")).toHaveTextContent(
      ARCHITECTURE_CREATED_EVIDENCE_CLAIM_DISCIPLINE,
    );
  });
});
