import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { architectureNestedComparePath } from "@/lib/architecture/architecture-routes";

const useWorkspaceModeMock = vi.fn();

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => useWorkspaceModeMock(),
}));

import { ArchitectureIdentityDeskCompareAction } from "@/components/architecture/ArchitectureIdentityDeskCompareAction";

describe("ArchitectureIdentityDeskCompareAction (CA-30 / AO-29)", () => {
  beforeEach(() => {
    useWorkspaceModeMock.mockReturnValue({
      mode: "guided",
      isWorkingMode: false,
    });
  });

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

  it("SN-017: Working nests Compare on the architecture desk", () => {
    useWorkspaceModeMock.mockReturnValue({
      mode: "working",
      isWorkingMode: true,
    });

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
      `${architectureNestedComparePath("architecture-identity-001")}?leftRunId=review-older&rightRunId=review-newer`,
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
