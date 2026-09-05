import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useArchitectureIdentitiesListQueryMock = vi.fn();

vi.mock("@/hooks/use-architecture-identities-list-query", () => ({
  useArchitectureIdentitiesListQuery: (...args: unknown[]) => useArchitectureIdentitiesListQueryMock(...args),
}));

import { ArchitectureIdentityListClient } from "@/components/architecture/ArchitectureIdentityListClient";

describe("ArchitectureIdentityListClient (DA-04 Working list)", () => {
  it("renders one architecture row with review counts from identity API", () => {
    useArchitectureIdentitiesListQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            architectureId: "architecture-identity-001",
            displayName: "Payments platform",
            updatedUtc: "2026-01-02T00:00:00Z",
            currentDraftId: "draft-open-1",
            latestReviewId: "review-2",
            latestSealedManifestId: "manifest-1",
            draftCount: 1,
            reviewCount: 2,
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 50,
        hasMore: false,
      },
    });

    render(<ArchitectureIdentityListClient />);

    expect(screen.getByTestId("architecture-identity-row-architecture-identity-001")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Payments platform" })).toHaveAttribute(
      "href",
      "/architecture/architectures/architecture-identity-001",
    );
  });
});
