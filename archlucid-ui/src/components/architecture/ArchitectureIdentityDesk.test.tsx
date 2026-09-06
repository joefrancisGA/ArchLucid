import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ArchitectureIdentityDetail } from "@/types/architecture-identity";

const useArchitectureIdentityQueryMock = vi.fn();

vi.mock("@/hooks/use-architecture-identity-query", () => ({
  useArchitectureIdentityQuery: (...args: unknown[]) => useArchitectureIdentityQueryMock(...args),
}));

vi.mock("@/hooks/use-rehydrate-in-flight-from-architecture", () => ({
  useRehydrateInFlightOperationsFromArchitecture: vi.fn(),
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
      runId: "review-2",
      description: "Second in-flight review",
      createdUtc: "2026-01-02T11:00:00Z",
    },
    {
      runId: "review-1",
      description: "First sealed review",
      createdUtc: "2026-01-01T10:00:00Z",
    },
  ],
  versions: [],
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
    expect(screen.getByTestId("architecture-identity-desk-honesty")).toHaveTextContent(
      "durable architecture identity",
    );
    expect(screen.getByTestId("architecture-identity-compare-entry")).toHaveAttribute(
      "href",
      "/insights/compare-two-reviews?leftRunId=review-1&rightRunId=review-2",
    );
    expect(screen.getAllByTestId(/^architecture-identity-review-row-/)).toHaveLength(2);
    expect(screen.getByTestId("architecture-identity-latest-seal-link")).toBeInTheDocument();
  });

  it("shows Start review when there are no child reviews yet", () => {
    useArchitectureIdentityQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        ...identityFixture,
        reviews: [],
        reviewCount: 0,
        latestReviewId: null,
        latestSealedManifestId: null,
      },
      refetch: vi.fn(),
    });

    render(<ArchitectureIdentityDesk architectureId={architectureId} />);

    expect(screen.getByTestId("architecture-identity-reviews-empty")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-identity-start-review")).toHaveAttribute(
      "href",
      "/architecture/reviews/new?path=guided-intake&sourceArchitectureId=draft-open-1",
    );
  });

  it("shows spawn-locked handoff controls instead of continue draft", () => {
    useArchitectureIdentityQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        ...identityFixture,
        currentDraftId: "draft-spawned",
        drafts: [
          {
            draftId: "draft-spawned",
            status: "RunSpawned",
            systemName: "Payments",
            updatedUtc: "2026-01-02T00:00:00Z",
          },
        ],
      },
      refetch: vi.fn(),
    });

    render(<ArchitectureIdentityDesk architectureId={architectureId} />);

    expect(screen.queryByTestId("architecture-identity-open-current-draft")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-identity-open-review")).toHaveAttribute(
      "href",
      "/architecture/reviews/review-2",
    );
    expect(screen.getByTestId("architecture-identity-new-version-from-snapshot")).toBeInTheDocument();
  });

  it("shows disabled compare reason when only one review exists", () => {
    useArchitectureIdentityQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        ...identityFixture,
        reviews: [identityFixture.reviews[0]!],
        reviewCount: 1,
      },
      refetch: vi.fn(),
    });

    render(<ArchitectureIdentityDesk architectureId={architectureId} />);

    expect(screen.getByTestId("architecture-identity-compare-disabled-reason")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-identity-compare-entry")).not.toBeInTheDocument();
  });
});
