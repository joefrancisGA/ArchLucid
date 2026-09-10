import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { ArchitectureCreatedGovernanceEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedGovernanceEvidenceOrientationStrip";
import { ARCHITECTURE_CREATED_GOVERNANCE_SOURCES } from "@/lib/architecture/architecture-created-governance-sources";

describe("ArchitectureCreatedGovernanceEvidenceOrientationStrip", () => {
  it("lists follow-up Sources and claim discipline copy", () => {
    render(<ArchitectureCreatedGovernanceEvidenceOrientationStrip />);

    expect(screen.getByTestId("architecture-governance-sources")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-governance-claim-discipline")).toBeInTheDocument();

    for (const link of ARCHITECTURE_CREATED_GOVERNANCE_SOURCES) {
      expectFollowUpLink(screen, link, { rawLabel: true });
    }

    expect(screen.getByText(/not the committed approval decision surface/i)).toBeInTheDocument();
  });
});
