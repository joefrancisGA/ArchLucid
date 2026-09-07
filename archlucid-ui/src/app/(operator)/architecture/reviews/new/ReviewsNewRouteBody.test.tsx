import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSearchParams = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useSearchParams: () => useSearchParams(),
    usePathname: () => "/architecture/reviews/new",
    useRouter: () => ({ replace }),
  };
});

const useProductionEvalChrome = vi.fn(() => false);
const useProductionDeskChrome = vi.fn(() => true);
const useWorkingStartHref = vi.fn(() => "/architecture/architectures/arch-1");

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => useProductionEvalChrome(),
  useProductionDeskChrome: () => useProductionDeskChrome(),
}));

vi.mock("@/hooks/use-working-start-href", () => ({
  useWorkingStartHref: () => useWorkingStartHref(),
}));

const useArchitectureIdentitiesListQuery = vi.fn();

vi.mock("@/hooks/use-architecture-identities-list-query", () => ({
  useArchitectureIdentitiesListQuery: () => useArchitectureIdentitiesListQuery(),
}));

vi.mock("./reviews-new-path-switcher-deferred-chunks", () => ({
  ReviewsNewPathSwitcherDeferred: () => <div data-testid="reviews-new-path-switcher-stub" />,
}));

import { ReviewsNewRouteBody } from "./ReviewsNewRouteBody";

describe("ReviewsNewRouteBody (AO-22)", () => {
  beforeEach(() => {
    replace.mockClear();
    useProductionEvalChrome.mockReturnValue(false);
    useProductionDeskChrome.mockReturnValue(true);
    useArchitectureIdentitiesListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          {
            architectureId: "architecture-identity-001",
            displayName: "Payments platform",
            draftCount: 1,
            reviewCount: 0,
            updatedUtc: "2026-01-01T00:00:00.000Z",
          },
        ],
        totalCount: 1,
      },
    });
  });

  it("shows architecture picker when Working guided-intake has no source architecture", async () => {
    useSearchParams.mockReturnValue(new URLSearchParams("path=guided-intake"));

    render(<ReviewsNewRouteBody />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-working-architecture-picker")).toBeInTheDocument();
    });
    expect(screen.getByTestId("reviews-new-pick-architecture-architecture-identity-001")).toHaveAttribute(
      "href",
      "/architecture/architectures/architecture-identity-001/reviews/new?path=guided-intake",
    );
    expect(screen.queryByTestId("reviews-new-path-switcher-stub")).toBeNull();
  });
});
