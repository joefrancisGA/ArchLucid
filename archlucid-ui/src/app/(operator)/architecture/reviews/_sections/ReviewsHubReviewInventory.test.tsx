import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RunSummary } from "@/types/authority";

const listArchitectureDraftRegistryEntries = vi.fn();

vi.mock("@/lib/architecture-draft-registry", () => ({
  listArchitectureDraftRegistryEntries: () => listArchitectureDraftRegistryEntries(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { ReviewsHubReviewInventory } from "./ReviewsHubReviewInventory";

beforeEach(() => {
  listArchitectureDraftRegistryEntries.mockReset();
  listArchitectureDraftRegistryEntries.mockReturnValue([]);
});

describe("ReviewsHubReviewInventory", () => {
  it("renders a rich empty state with start and sample actions when no drafts exist", () => {
    render(<ReviewsHubReviewInventory runs={[]} />);

    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-recent-empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start an architecture review" })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(screen.getByRole("link", { name: "Explore the sample review" })).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-hub-recent-empty-help-link")).not.toBeInTheDocument();
  });

  it("keeps rich empty CTAs when drafts exist", () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([
      {
        architectureId: "draft-001",
        displayName: "Payments platform draft",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-15T12:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-15T12:00:00.000Z",
      },
    ]);

    render(<ReviewsHubReviewInventory runs={[]} />);

    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(screen.getByText(/Continue editing from the header/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start an architecture review" })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(screen.getByRole("link", { name: "Explore the sample review" })).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-hub-recent-empty-help-link")).not.toBeInTheDocument();
  });

  it("renders review rows with governance, risks, and StatusTag", () => {
    render(
      <ReviewsHubReviewInventory
        runs={[
          {
            runId: "review-001",
            projectId: "claims-intake",
            description: "Claims intake modernization",
            createdUtc: "2026-01-15T12:00:00.000Z",
            hasFindingsSnapshot: true,
            findingCount: 2,
          } satisfies RunSummary,
        ]}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Review" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Architecture / system" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Governance" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Risks" })).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-row-review-001")).toBeInTheDocument();
    const titleLink = screen.getByTestId("reviews-hub-primary-action-review-001");
    expect(titleLink).toHaveAttribute("href");
    expect(titleLink.className).toMatch(/underline/);
    expect(titleLink.className).not.toMatch(/no-underline/);
    expect(screen.queryByRole("columnheader", { name: "Action" })).toBeNull();
  });

  it("filters to finalized reviews from the primary FilterChip row", () => {
    render(
      <ReviewsHubReviewInventory
        runs={[
          {
            runId: "draft",
            projectId: "default",
            createdUtc: "2026-01-15T12:00:00.000Z",
          } satisfies RunSummary,
          {
            runId: "finalized",
            projectId: "default",
            createdUtc: "2026-01-10T12:00:00.000Z",
            hasGoldenManifest: true,
          } satisfies RunSummary,
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Filter reviews: Finalized" }));

    expect(screen.getByTestId("reviews-hub-row-finalized")).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-hub-row-draft")).toBeNull();
  });
});
