import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureIdentityDeskCompareAction } from "@/components/architecture/ArchitectureIdentityDeskCompareAction";

describe("ArchitectureIdentityDeskCompareAction (CA-30)", () => {
  it("prefills both sibling reviews in the compare href", () => {
    render(
      <ArchitectureIdentityDeskCompareAction
        reviews={[
          { runId: "review-newer", description: "Second review", createdUtc: "2026-01-02T00:00:00Z" },
          { runId: "review-older", description: "First review", createdUtc: "2026-01-01T00:00:00Z" },
        ]}
      />,
    );

    expect(screen.getByTestId("architecture-identity-compare-entry")).toHaveAttribute(
      "href",
      "/insights/compare-two-reviews?leftRunId=review-older&rightRunId=review-newer",
    );
  });

  it("shows an inline disabled reason when fewer than two reviews exist", () => {
    render(
      <ArchitectureIdentityDeskCompareAction
        reviews={[{ runId: "review-1", description: "Only review", createdUtc: "2026-01-01T00:00:00Z" }]}
      />,
    );

    expect(screen.getByTestId("architecture-identity-compare-disabled-reason")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-identity-compare-entry")).not.toBeInTheDocument();
  });
});
