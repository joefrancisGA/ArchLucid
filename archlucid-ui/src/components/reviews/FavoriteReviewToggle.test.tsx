import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => false,
}));

vi.mock("@/hooks/use-review-pin-mutation", () => ({
  useReviewPinMutation: () => ({
    pinBusyRunId: null,
    setRunPinned: vi.fn(async () => true),
  }),
}));

import { FavoriteReviewToggle } from "@/components/reviews/FavoriteReviewToggle";
import {
  FAVORITE_REVIEWS_STORAGE_KEY,
  listFavoriteReviews,
} from "@/lib/favorite-reviews";

describe("FavoriteReviewToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("pins and unpins an architecture package", () => {
    render(<FavoriteReviewToggle runId="run-42" title="Claims package" />);

    const toggle = screen.getByTestId("favorite-review-toggle");

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("data-favorited", "false");
    expect(toggle.querySelector("svg")).not.toHaveClass("fill-current");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAttribute("data-favorited", "true");
    expect(toggle.querySelector("svg")).toHaveClass("fill-current");
    expect(listFavoriteReviews()).toEqual([
      expect.objectContaining({ runId: "run-42", title: "Claims package" }),
    ]);
    expect(window.localStorage.getItem(FAVORITE_REVIEWS_STORAGE_KEY)).not.toBeNull();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(listFavoriteReviews()).toEqual([]);
  });

  it("renders a labeled pin control for the review header", () => {
    render(<FavoriteReviewToggle runId="run-42" title="Claims package" size="sm" />);

    expect(screen.getByText("Pin")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("favorite-review-toggle"));

    expect(screen.getByText("Pinned")).toBeInTheDocument();
    expect(screen.getByTestId("favorite-review-toggle").querySelector("svg")).toHaveClass("fill-current");
  });
});