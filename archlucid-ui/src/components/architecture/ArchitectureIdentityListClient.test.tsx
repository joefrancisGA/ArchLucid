import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useArchitectureIdentitiesListQueryMock = vi.fn();

vi.mock("@/hooks/use-architecture-identities-list-query", () => ({
  useArchitectureIdentitiesListQuery: (...args: unknown[]) => useArchitectureIdentitiesListQueryMock(...args),
}));

import { ArchitectureIdentityListClient } from "@/components/architecture/ArchitectureIdentityListClient";

describe("ArchitectureIdentityListClient (DA-04 Working list)", () => {
  it("renders one architecture row with two reviews grouped under one identity", () => {
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
        archivedHiddenCount: 0,
      },
    });

    render(<ArchitectureIdentityListClient />);

    expect(screen.getByTestId("architecture-identity-row-architecture-identity-001")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Architecture portfolio" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Payments platform" })).toHaveAttribute(
      "href",
      "/architecture/architectures/architecture-identity-001",
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("CA-39: shouts incompleteness when totalCount exceeds loaded rows", () => {
    useArchitectureIdentitiesListQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: Array.from({ length: 20 }, (_, index) => ({
          architectureId: `architecture-identity-${index}`,
          displayName: `Architecture ${index}`,
          updatedUtc: "2026-01-02T00:00:00Z",
          currentDraftId: null,
          latestReviewId: null,
          latestSealedManifestId: null,
          draftCount: 0,
          reviewCount: 0,
        })),
        totalCount: 47,
        page: 1,
        pageSize: 50,
        hasMore: false,
        archivedHiddenCount: 0,
      },
    });

    render(<ArchitectureIdentityListClient />);

    expect(screen.getByTestId("architecture-identity-list-showing-count")).toHaveTextContent("Showing 20 of 47");
  });

  it("CA-39: does not shout when all architectures fit one page", () => {
    useArchitectureIdentitiesListQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: Array.from({ length: 47 }, (_, index) => ({
          architectureId: `architecture-identity-${index}`,
          displayName: `Architecture ${index}`,
          updatedUtc: "2026-01-02T00:00:00Z",
          currentDraftId: null,
          latestReviewId: null,
          latestSealedManifestId: null,
          draftCount: 0,
          reviewCount: 0,
        })),
        totalCount: 47,
        page: 1,
        pageSize: 50,
        hasMore: false,
        archivedHiddenCount: 0,
      },
    });

    render(<ArchitectureIdentityListClient />);

    expect(screen.queryByTestId("architecture-identity-list-showing-count")).not.toBeInTheDocument();
  });

  it("CA-35: Working empty state offers New architecture without sample hrefs", () => {
    useArchitectureIdentitiesListQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 50,
        hasMore: false,
        archivedHiddenCount: 0,
      },
    });

    render(<ArchitectureIdentityListClient />);

    const createLink = screen.getByRole("link", { name: "New architecture" });

    expect(createLink).toHaveAttribute("href", "/architecture/architectures/new");
    expect(screen.queryByRole("link", { name: /sample/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /claims intake/i })).not.toBeInTheDocument();
  });

  it("CA-49: surfaces archived-hidden honesty and toggles includeArchived query", () => {
    useArchitectureIdentitiesListQueryMock.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            architectureId: "architecture-identity-active",
            displayName: "Active platform",
            updatedUtc: "2026-01-02T00:00:00Z",
            currentDraftId: null,
            latestReviewId: null,
            latestSealedManifestId: null,
            draftCount: 0,
            reviewCount: 0,
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 50,
        hasMore: false,
        archivedHiddenCount: 2,
      },
    });

    render(<ArchitectureIdentityListClient />);

    expect(screen.getByTestId("architecture-identity-list-hidden-archived-band")).toHaveTextContent(
      "2 architectures hidden by archived filter",
    );

    fireEvent.click(screen.getByTestId("inventory-hidden-filter-show-all"));

    expect(useArchitectureIdentitiesListQueryMock).toHaveBeenLastCalledWith(1, undefined, { includeArchived: true });
  });
});
