import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureCreatedOverviewEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedOverviewEvidenceOrientationStrip";
import { ARCHITECTURE_CREATED_OVERVIEW_SOURCES } from "@/lib/architecture/architecture-created-overview-sources";

describe("ArchitectureCreatedOverviewEvidenceOrientationStrip", () => {
  it("lists follow-up Sources and claim discipline copy", () => {
    render(<ArchitectureCreatedOverviewEvidenceOrientationStrip />);

    expect(screen.getByTestId("architecture-overview-sources")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-overview-claim-discipline")).toBeInTheDocument();

    for (const link of ARCHITECTURE_CREATED_OVERVIEW_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(screen.getByText(/not a signed-record Sources trail/i)).toBeInTheDocument();
  });
});
