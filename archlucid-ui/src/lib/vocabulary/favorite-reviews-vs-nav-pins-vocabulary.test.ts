import { describe, expect, it } from "vitest";

import {
  FAVORITE_REVIEWS_SURFACE_PATH,
  FAVORITE_REVIEWS_VS_NAV_PINS_COMPACT_LINE,
  FAVORITE_REVIEWS_VS_NAV_PINS_FAVORITES_LINK,
  FAVORITE_REVIEWS_VS_NAV_PINS_HEADING,
  FAVORITE_REVIEWS_VS_NAV_PINS_NAV_PINS_LINK,
  FAVORITE_REVIEWS_VS_NAV_PINS_WHY_TWO,
  NAV_PINNED_LINKS_PANEL_HREF,
  buildFavoriteReviewsVsNavPinsVocabulary,
  resolveFavoriteReviewsVsNavPinsPeerLink,
} from "@/lib/vocabulary/favorite-reviews-vs-nav-pins-vocabulary";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";

describe("favorite-reviews-vs-nav-pins-vocabulary (TB-2269)", () => {
  it("explains pinned packages vs nav route pins", () => {
    const model = buildFavoriteReviewsVsNavPinsVocabulary();

    expect(model.heading).toBe(FAVORITE_REVIEWS_VS_NAV_PINS_HEADING);
    expect(model.heading.toLowerCase()).toContain("pin");
    expect(model.whyTwo).toBe(FAVORITE_REVIEWS_VS_NAV_PINS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("architecture package");
    expect(model.whyTwo.toLowerCase()).toContain("nav");
    expect(model.compactLine).toBe(FAVORITE_REVIEWS_VS_NAV_PINS_COMPACT_LINE);

    expect(model.favoriteReviewsLink).toEqual(FAVORITE_REVIEWS_VS_NAV_PINS_FAVORITES_LINK);
    expect(model.favoriteReviewsLink.href).toBe(FAVORITE_REVIEWS_SURFACE_PATH);
    expect(model.favoriteReviewsLink.href).toBe(REVIEWS_LIST_PATH);
    expect(model.favoriteReviewsLink.href).toBe("/architecture/reviews");

    expect(model.navPinsLink).toEqual(FAVORITE_REVIEWS_VS_NAV_PINS_NAV_PINS_LINK);
    expect(model.navPinsLink.href).toBe(NAV_PINNED_LINKS_PANEL_HREF);
    expect(model.navPinsLink.href).toBe("#nav-pinned-links-panel");
  });

  it("resolves the peer surface from favorites and nav pins", () => {
    expect(resolveFavoriteReviewsVsNavPinsPeerLink("favorite-reviews")).toEqual(
      FAVORITE_REVIEWS_VS_NAV_PINS_NAV_PINS_LINK,
    );

    expect(resolveFavoriteReviewsVsNavPinsPeerLink("nav-pins")).toEqual(
      FAVORITE_REVIEWS_VS_NAV_PINS_FAVORITES_LINK,
    );
  });
});
