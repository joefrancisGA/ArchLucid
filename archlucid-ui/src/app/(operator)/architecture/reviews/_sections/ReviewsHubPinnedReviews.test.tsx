import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { writeFavoriteReviews } from "@/lib/favorite-reviews";

import { ReviewsHubPinnedReviews } from "./ReviewsHubPinnedReviews";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/FavoriteReviewsVsNavPinsVocabularyRail", () => ({
  FavoriteReviewsVsNavPinsVocabularyRail: () => <div data-testid="vocab-rail-mock" />,
}));

describe("ReviewsHubPinnedReviews", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("does not render the pinned reviews section when nothing is pinned", async () => {
    render(<ReviewsHubPinnedReviews />);

    await waitFor(() => {
      expect(screen.queryByTestId("reviews-hub-pinned-reviews")).not.toBeInTheDocument();
    });
  });

  it("renders pinned reviews when at least one review is pinned", async () => {
    writeFavoriteReviews([
      { runId: "run-a", title: "Claims package", pinnedAt: "2026-08-10T12:00:00.000Z" },
    ]);

    render(<ReviewsHubPinnedReviews />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-hub-pinned-reviews")).toBeInTheDocument();
    });

    expect(screen.getByTestId("favorite-reviews-link-run-a")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-a",
    );
    expect(screen.getByText("Claims package")).toBeInTheDocument();
  });
});
