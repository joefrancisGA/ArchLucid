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
  it("renders Compact empty with sample outline only when no drafts exist", () => {
    render(<ReviewsHubReviewInventory runs={[]} />);

    expect(screen.getByText("Start your first architecture review")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-recent-empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore the sample review" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start an architecture review" })).toBeNull();
    expect(screen.queryByTestId("reviews-hub-recent-empty-start-review")).toBeNull();
    expect(screen.queryByTestId("reviews-hub-recent-empty-sample-link")).toBeNull();
  });

  it("keeps draft-aware empty copy-only with a quiet sample link", () => {
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
    expect(screen.queryByText("Start your first architecture review")).toBeNull();
    expect(screen.getByTestId("reviews-hub-recent-empty-sample-link")).toHaveTextContent(
      "Explore the sample review",
    );
    expect(screen.queryByRole("link", { name: "Continue editing draft" })).toBeNull();
  });

  it("renders review rows with StatusTag and resting title underline", () => {
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
