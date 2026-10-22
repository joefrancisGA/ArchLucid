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
  ReviewsNewSocraticIntakeWizardDeferred: () => <div data-testid="socratic-intake-wizard-stub" />,
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

  it("Working Start does not mount reviews-new-job-chooser-section on bare /architecture/reviews/new (AO-45)", async () => {
    useSearchParams.mockReturnValue(new URLSearchParams());
    useProductionDeskChrome.mockReturnValue(true);
    useProductionEvalChrome.mockReturnValue(false);
    replace.mockClear();

    render(<ReviewsNewRouteBody />);

    expect(screen.getByTestId("reviews-new-working-redirect")).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-new-path-switcher-stub")).toBeNull();
    expect(screen.queryByTestId("reviews-new-job-chooser-section")).toBeNull();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/architecture/architectures/arch-1");
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

  it("keeps the baseline wizard deep link in Working mode", async () => {
    useSearchParams.mockReturnValue(new URLSearchParams("baseline=1"));

    render(<ReviewsNewRouteBody />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-path-switcher-stub")).toBeInTheDocument();
    });

    expect(replace).not.toHaveBeenCalled();
    expect(screen.queryByTestId("reviews-new-working-redirect")).toBeNull();
  });

  it.each(["preset=greenfield", "accelerator=ai-llm-workload"])(
    "keeps wizard deep link %s in Working mode",
    async (query) => {
      useSearchParams.mockReturnValue(new URLSearchParams(query));

      render(<ReviewsNewRouteBody />);

      await waitFor(() => {
        expect(screen.getByTestId("reviews-new-path-switcher-stub")).toBeInTheDocument();
      });

      expect(replace).not.toHaveBeenCalled();
      expect(screen.queryByTestId("reviews-new-working-redirect")).toBeNull();
    },
  );

  it("keeps the baseline wizard on Working Start when baseline=1 is set without path=", async () => {
    useSearchParams.mockReturnValue(new URLSearchParams("baseline=1"));
    replace.mockClear();

    render(<ReviewsNewRouteBody />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-path-switcher-stub")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("reviews-new-working-redirect")).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it("keeps the path switcher for path=detailed&baseline=1 so the simplified wizard can mount", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("path=detailed&baseline=1"));
    replace.mockClear();

    render(<ReviewsNewRouteBody />);

    expect(screen.getByTestId("reviews-new-path-switcher-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-new-working-redirect")).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it("opens guided questions when Working guided-intake has no architectures", async () => {
    useSearchParams.mockReturnValue(new URLSearchParams("path=guided-intake"));
    useArchitectureIdentitiesListQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { items: [], totalCount: 0 },
    });

    render(<ReviewsNewRouteBody />);

    await waitFor(() => {
      expect(screen.getByTestId("socratic-intake-wizard-stub")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("reviews-new-working-architecture-picker")).toBeNull();
    expect(screen.queryByText("Pick an architecture to start a review")).toBeNull();
    expect(screen.queryByText("No architectures in this workspace yet.")).toBeNull();
  });
});
