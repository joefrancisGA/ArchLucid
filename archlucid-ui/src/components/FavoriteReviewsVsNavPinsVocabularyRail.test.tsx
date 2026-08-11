import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FavoriteReviewsVsNavPinsVocabularyRail } from "@/components/FavoriteReviewsVsNavPinsVocabularyRail";
import {
  FAVORITE_REVIEWS_VS_NAV_PINS_COMPACT_LINE,
  FAVORITE_REVIEWS_VS_NAV_PINS_FAVORITES_LINK,
  FAVORITE_REVIEWS_VS_NAV_PINS_HEADING,
  FAVORITE_REVIEWS_VS_NAV_PINS_NAV_PINS_LINK,
  FAVORITE_REVIEWS_VS_NAV_PINS_WHY_TWO,
} from "@/lib/vocabulary/favorite-reviews-vs-nav-pins-vocabulary";

describe("FavoriteReviewsVsNavPinsVocabularyRail (TB-2269)", () => {
  it("renders favorites strip with peer link to nav pins", () => {
    render(<FavoriteReviewsVsNavPinsVocabularyRail currentSurfaceId="favorite-reviews" />);

    const strip = screen.getByTestId("favorite-reviews-vs-nav-pins-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "favorite-reviews");
    expect(strip.textContent ?? "").toContain(FAVORITE_REVIEWS_VS_NAV_PINS_COMPACT_LINE);

    const peer = screen.getByTestId("favorite-reviews-vs-nav-pins-vocabulary-peer-link");
    expect(peer).toHaveTextContent(FAVORITE_REVIEWS_VS_NAV_PINS_NAV_PINS_LINK.label);
    expect(peer).toHaveAttribute("href", FAVORITE_REVIEWS_VS_NAV_PINS_NAV_PINS_LINK.href);
  });

  it("renders nav pins strip with peer link to favorites", () => {
    render(<FavoriteReviewsVsNavPinsVocabularyRail currentSurfaceId="nav-pins" />);

    expect(screen.getByTestId("favorite-reviews-vs-nav-pins-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "nav-pins",
    );

    const peer = screen.getByTestId("favorite-reviews-vs-nav-pins-vocabulary-peer-link");
    expect(peer).toHaveTextContent(FAVORITE_REVIEWS_VS_NAV_PINS_FAVORITES_LINK.label);
    expect(peer).toHaveAttribute("href", FAVORITE_REVIEWS_VS_NAV_PINS_FAVORITES_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <FavoriteReviewsVsNavPinsVocabularyRail
        currentSurfaceId="favorite-reviews"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("favorite-reviews-vs-nav-pins-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(FAVORITE_REVIEWS_VS_NAV_PINS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(FAVORITE_REVIEWS_VS_NAV_PINS_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("favorite-reviews-vs-nav-pins-vocabulary-current")).toHaveTextContent(
      FAVORITE_REVIEWS_VS_NAV_PINS_FAVORITES_LINK.label,
    );
  });
});
