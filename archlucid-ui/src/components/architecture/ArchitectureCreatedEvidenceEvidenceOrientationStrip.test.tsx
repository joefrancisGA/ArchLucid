import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { ArchitectureCreatedEvidenceEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedEvidenceEvidenceOrientationStrip";
import { ARCHITECTURE_CREATED_EVIDENCE_SOURCES } from "@/lib/architecture/architecture-created-evidence-sources";

describe("ArchitectureCreatedEvidenceEvidenceOrientationStrip", () => {
  it("lists follow-up Sources and claim discipline copy", () => {
    render(<ArchitectureCreatedEvidenceEvidenceOrientationStrip />);

    expect(screen.getByTestId("architecture-evidence-sources")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-evidence-claim-discipline")).toBeInTheDocument();

    for (const link of ARCHITECTURE_CREATED_EVIDENCE_SOURCES) {
      expectFollowUpLink(screen, link, { rawLabel: true });
    }

    expect(screen.getByText(/not a finalized review record export trail/i)).toBeInTheDocument();
  });
});
