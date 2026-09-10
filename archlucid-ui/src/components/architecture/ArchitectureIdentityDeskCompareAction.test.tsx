import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureIdentityDeskCompareAction } from "@/components/architecture/ArchitectureIdentityDeskCompareAction";

describe("ArchitectureIdentityDeskCompareAction (CA-30 / AO-29)", () => {
  it("AO-29: prefills sibling reviews and architecture scope in the compare href", () => {
    render(
      <ArchitectureIdentityDeskCompareAction
        architectureId="architecture-identity-001"
        reviews={[
          { runId: "review-newer", description: "Second review", createdUtc: "2026-01-02T00:00:00Z" },
          { runId: "review-older", description: "First review", createdUtc: "2026-01-01T00:00:00Z" },
        ]}
      />,
    );

    expect(screen.getByTestId("architecture-identity-compare-entry")).toHaveAttribute(
      "href",
      "/insights/compare-two-reviews?priorRunId=review-older&laterRunId=review-newer&architectureId=architecture-identity-001",
    );
  });

  it("shows an inline disabled reason when fewer than two reviews exist", () => {
    render(
      <ArchitectureIdentityDeskCompareAction
        architectureId="architecture-identity-001"
        reviews={[{ runId: "review-1", description: "Only review", createdUtc: "2026-01-01T00:00:00Z" }]}
      />,
    );

    expect(screen.getByTestId("architecture-identity-compare-disabled-reason")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-identity-compare-entry")).not.toBeInTheDocument();
  });
});
