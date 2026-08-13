import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureCreatedClarificationsEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedClarificationsEvidenceOrientationStrip";
import { ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES } from "@/lib/architecture/architecture-created-clarifications-sources";

describe("ArchitectureCreatedClarificationsEvidenceOrientationStrip", () => {
  it("lists follow-up Sources and claim discipline copy", () => {
    render(<ArchitectureCreatedClarificationsEvidenceOrientationStrip />);

    expect(screen.getByTestId("architecture-clarifications-sources")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-clarifications-claim-discipline")).toBeInTheDocument();

    for (const link of ARCHITECTURE_CREATED_CLARIFICATIONS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(screen.getByText(/not a signed-record Sources trail/i)).toBeInTheDocument();
  });
});
