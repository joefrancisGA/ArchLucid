import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FavoriteReviewsList } from "@/components/reviews/FavoriteReviewsList";
import { writeFavoriteReviews } from "@/lib/favorite-reviews";

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

describe("FavoriteReviewsList", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders nothing when nothing is pinned", async () => {
    render(<FavoriteReviewsList />);

    await waitFor(() => {
      expect(screen.queryByTestId("favorite-reviews-list")).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId("favorite-reviews-empty")).not.toBeInTheDocument();
  });

  it("lists pinned architecture reviews with review links", async () => {
    writeFavoriteReviews([
      { runId: "run-a", title: "Claims package", pinnedAt: "2026-08-10T12:00:00.000Z" },
      { runId: "run-b", pinnedAt: "2026-08-09T12:00:00.000Z" },
    ]);

    render(<FavoriteReviewsList />);

    await waitFor(() => {
      expect(screen.getByTestId("favorite-reviews-link-run-a")).toBeInTheDocument();
    });

    expect(screen.getByTestId("favorite-reviews-link-run-a")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-a",
    );
    expect(screen.getByText("Claims package")).toBeInTheDocument();
    expect(screen.getByTestId("favorite-reviews-link-run-b")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-b",
    );
    expect(screen.getByText("run-b")).toBeInTheDocument();
    expect(screen.getAllByTestId("favorite-review-toggle")).toHaveLength(2);
  });
});