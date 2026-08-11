"use client";

import { FavoriteReviewsVsNavPinsVocabularyRail } from "@/components/FavoriteReviewsVsNavPinsVocabularyRail";
import { FavoriteReviewsList } from "@/components/reviews/FavoriteReviewsList";

import {
  REVIEWS_HUB_PINNED_REVIEWS_EMPTY,
  REVIEWS_HUB_PINNED_REVIEWS_TITLE,
} from "./reviews-hub-copy";

/** Pinned architecture packages on the reviews hub (TB-2206). */
export function ReviewsHubPinnedReviews(): React.JSX.Element {
  return (
    <div className="mt-6" data-testid="reviews-hub-pinned-reviews">
      <FavoriteReviewsVsNavPinsVocabularyRail currentSurfaceId="favorite-reviews" />
      <FavoriteReviewsList
        heading={REVIEWS_HUB_PINNED_REVIEWS_TITLE}
        emptyHint={REVIEWS_HUB_PINNED_REVIEWS_EMPTY}
      />
    </div>
  );
}