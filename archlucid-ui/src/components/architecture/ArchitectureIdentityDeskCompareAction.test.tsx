import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { architectureNestedComparePath } from "@/lib/architecture/architecture-routes";

const mockWorkspaceMode = vi.fn(() => ({
  mode: "guided" as const,
  mounted: true,
  accountSyncState: "synced" as const,
  isWorkingMode: false,
  setAndPersist: vi.fn(),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => mockWorkspaceMode(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import { ArchitectureIdentityDeskCompareAction } from "@/components/architecture/ArchitectureIdentityDeskCompareAction";

describe("ArchitectureIdentityDeskCompareAction (CA-30 / AO-29 / SN-027)", () => {
  beforeEach(() => {
    mockWorkspaceMode.mockReturnValue({
      mode: "guided",
      mounted: true,
      accountSyncState: "synced",
      isWorkingMode: false,
      setAndPersist: vi.fn(),
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

  it("shows an inline disabled reason when fewer than two reviews exist in Guided mode", () => {
    render(
      <ArchitectureIdentityDeskCompareAction
        architectureId="architecture-identity-001"
        reviews={[{ runId: "review-1", description: "Only review", createdUtc: "2026-01-01T00:00:00Z" }]}
      />,
    );

    expect(screen.getByTestId("architecture-identity-compare-disabled-reason")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-identity-compare-entry")).not.toBeInTheDocument();
  });

  it("SN-027: Working mode opens nested compare with both sibling reviews prefilled", () => {
    mockWorkspaceMode.mockReturnValue({
      mode: "working",
      mounted: true,
      accountSyncState: "synced",
      isWorkingMode: true,
      setAndPersist: vi.fn(),
    });

    render(
      <ArchitectureIdentityDeskCompareAction
        architectureId="architecture-identity-001"
        latestReviewId="review-newer"
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

  it("SN-027: Working mode pre-fills base when only one sealed child exists", () => {
    mockWorkspaceMode.mockReturnValue({
      mode: "working",
      mounted: true,
      accountSyncState: "synced",
      isWorkingMode: true,
      setAndPersist: vi.fn(),
    });

    render(
      <ArchitectureIdentityDeskCompareAction
        architectureId="architecture-identity-001"
        latestReviewId="review-1"
        reviews={[{ runId: "review-1", description: "Only review", createdUtc: "2026-01-01T00:00:00Z" }]}
      />,
    );

    expect(screen.getByTestId("architecture-identity-compare-entry")).toHaveAttribute(
      "href",
      `${architectureNestedComparePath("architecture-identity-001")}?leftRunId=review-1`,
    );
  });
});
