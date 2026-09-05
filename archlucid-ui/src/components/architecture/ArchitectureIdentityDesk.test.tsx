import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ArchitectureIdentityDetail } from "@/types/architecture-identity";

const useArchitectureIdentityQueryMock = vi.fn();

vi.mock("@/hooks/use-architecture-identity-query", () => ({
  useArchitectureIdentityQuery: (...args: unknown[]) => useArchitectureIdentityQueryMock(...args),
}));

import { ArchitectureIdentityDesk } from "@/components/architecture/ArchitectureIdentityDesk";

const architectureId = "architecture-identity-001";

const identityFixture: ArchitectureIdentityDetail = {
  architectureId,
  displayName: "Payments platform",
  description: null,
  currentModelId: null,
  latestSealedManifestId: "manifest-1",
  currentDraftId: "draft-open-1",
  latestReviewId: "review-2",
  draftCount: 1,
  reviewCount: 2,
  createdUtc: "2026-01-01T00:00:00Z",
  updatedUtc: "2026-01-02T00:00:00Z",
  drafts: [
    {
      draftId: "draft-open-1",
      status: "Drafting",
      systemName: "Payments",
      updatedUtc: "2026-01-02T00:00:00Z",
    },
  ],
  reviews: [
    {
      runId: "review-1",
      description: "First sealed review",
      createdUtc: "2026-01-01T10:00:00Z",
    },
    {
      runId: "review-2",
      description: "Second in-flight review",
      createdUtc: "2026-01-02T11:00:00Z",
    },
  ],
};

describe("ArchitectureIdentityDesk (DA-04 Working fixture)", () => {
  it("shows one architecture with child reviews for this ArchitectureId only", () => {
    useArchitectureIdentityQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: identityFixture,
      refetch: vi.fn(),
    });

    render(<ArchitectureIdentityDesk architectureId={architectureId} />);

    expect(screen.getByTestId("architecture-identity-desk-title")).toHaveTextContent("Payments platform");
    expect(screen.getAllByTestId(/^architecture-identity-review-row-/)).toHaveLength(2);
    expect(screen.getByTestId("architecture-identity-review-row-review-1")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-identity-review-row-review-2")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-identity-compare-entry")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-identity-latest-seal-link")).toBeInTheDocument();
  });
});
