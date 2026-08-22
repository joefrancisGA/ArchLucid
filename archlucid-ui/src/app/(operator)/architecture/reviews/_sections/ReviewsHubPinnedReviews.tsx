"use client";

import { FavoriteReviewsList } from "@/components/reviews/FavoriteReviewsList";
import { useFavoriteReviews } from "@/hooks/use-favorite-reviews";

import { REVIEWS_HUB_PINNED_REVIEWS_TITLE } from "./reviews-hub-copy";

/** Pinned architecture reviews on the reviews hub (TB-2206). Omitted when nothing is pinned. */
export function ReviewsHubPinnedReviews(): React.JSX.Element | null {
  const { favorites } = useFavoriteReviews();

  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className="mt-6" data-testid="reviews-hub-pinned-reviews">
      <FavoriteReviewsList heading={REVIEWS_HUB_PINNED_REVIEWS_TITLE} />
    </div>
  );
}
