import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

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

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAttribute("data-favorited", "true");
    expect(listFavoriteReviews()).toEqual([
      expect.objectContaining({ runId: "run-42", title: "Claims package" }),
    ]);
    expect(window.localStorage.getItem(FAVORITE_REVIEWS_STORAGE_KEY)).not.toBeNull();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(listFavoriteReviews()).toEqual([]);
  });
});