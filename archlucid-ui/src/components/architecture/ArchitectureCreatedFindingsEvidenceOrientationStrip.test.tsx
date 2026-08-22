import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { ArchitectureCreatedFindingsEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedFindingsEvidenceOrientationStrip";
import { ARCHITECTURE_CREATED_FINDINGS_SOURCES } from "@/lib/architecture/architecture-created-findings-sources";

describe("ArchitectureCreatedFindingsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources and claim discipline copy", () => {
    render(<ArchitectureCreatedFindingsEvidenceOrientationStrip />);

    expect(screen.getByTestId("architecture-findings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-findings-claim-discipline")).toBeInTheDocument();

    for (const link of ARCHITECTURE_CREATED_FINDINGS_SOURCES) {
      expectFollowUpLink(screen, link);
    }

    expect(screen.getByText(/not a finalized review record export trail/i)).toBeInTheDocument();
  });
});
