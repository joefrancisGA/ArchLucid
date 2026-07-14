import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RunSummary } from "@/types/authority";

import { ReviewsHubReviewInventory } from "./ReviewsHubReviewInventory";

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

describe("ReviewsHubReviewInventory", () => {
  it("renders the review-centered empty state", () => {
    render(<ReviewsHubReviewInventory runs={[]} />);

    expect(screen.getByText("Start your first architecture review")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-recent-empty-start-review")).toHaveTextContent("Start an architecture review");
    expect(screen.getByTestId("reviews-hub-recent-empty-sample-review")).toHaveTextContent("Explore the sample review");
  });

  it("renders review rows with architecture and status columns", () => {
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
    expect(screen.getByTestId("reviews-hub-primary-action-review-001")).toHaveTextContent("Review findings");
  });

  it("filters to finalized reviews", () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Finalized" }));

    expect(screen.getByTestId("reviews-hub-row-finalized")).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-hub-row-draft")).toBeNull();
  });
});
