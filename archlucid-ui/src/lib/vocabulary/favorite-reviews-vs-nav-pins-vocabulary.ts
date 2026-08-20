/**
 * TB-2269 — Favorites (pinned packages) ≠ nav pins vocabulary rail.
 *
 * Why two pin affordances exist:
 * - Pinned reviews / favorites (`/architecture/reviews`) pin *architecture
 *   packages* you reopen often so you can skip inventory search.
 * - Nav pins (sidebar `#nav-pinned-links-panel`) pin *nav routes* for quick
 *   access to pages — not packages.
 *
 * They stay separate because pinning a package is not the same task as pinning
 * a navigation route. Operators need both so they do not treat sidebar route
 * pins as package favorites (or the reverse).
 */

import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

/** Reviews hub hosts pinned architecture packages (favorites). */
export const FAVORITE_REVIEWS_SURFACE_PATH = REVIEWS_LIST_PATH;

/**
 * Nav route pins live in the sidebar panel (no dedicated page).
 * Hash targets {@link NavPinnedLinksPanel} `id` for same-page scroll.
 */
export const NAV_PINNED_LINKS_PANEL_HREF = "#nav-pinned-links-panel" as const;

export type FavoriteReviewsVsNavPinsSurfaceId = "favorite-reviews" | "nav-pins";

export type FavoriteReviewsVsNavPinsLink = {
  readonly id: FavoriteReviewsVsNavPinsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type FavoriteReviewsVsNavPinsVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly favoriteReviewsLink: FavoriteReviewsVsNavPinsLink;
  readonly navPinsLink: FavoriteReviewsVsNavPinsLink;
};

export const FAVORITE_REVIEWS_VS_NAV_PINS_HEADING =
  "Pinned packages and nav pins serve different purposes" as const;

export const FAVORITE_REVIEWS_VS_NAV_PINS_WHY_TWO =
  "Pinned reviews save architecture packages you reopen often so you can skip inventory search. Nav pins save sidebar routes for quick page access. Pinning a package is not the same as pinning a navigation route." as const;

export const FAVORITE_REVIEWS_VS_NAV_PINS_COMPACT_LINE =
  "Pinned reviews pin architecture packages; nav pins pin routes — open the other when you need both." as const;

export const FAVORITE_REVIEWS_VS_NAV_PINS_FAVORITES_LINK: FavoriteReviewsVsNavPinsLink = {
  id: "favorite-reviews",
  label: "Pinned reviews",
  href: FAVORITE_REVIEWS_SURFACE_PATH,
  whenToUse: "Pin architecture packages you revisit often on the reviews hub.",
};

export const FAVORITE_REVIEWS_VS_NAV_PINS_NAV_PINS_LINK: FavoriteReviewsVsNavPinsLink = {
  id: "nav-pins",
  label: "Nav pins",
  href: NAV_PINNED_LINKS_PANEL_HREF,
  whenToUse: "Pin frequently used nav routes in the sidebar for quick page access.",
};

/** Pairwise model for Pinned reviews ↔ Nav pins (fixed routes). */
export function buildFavoriteReviewsVsNavPinsPairwiseRail(): PairwiseVocabularyRailModel<FavoriteReviewsVsNavPinsSurfaceId> {
  return {
    heading: FAVORITE_REVIEWS_VS_NAV_PINS_HEADING,
    whyTwo: FAVORITE_REVIEWS_VS_NAV_PINS_WHY_TWO,
    compactLine: FAVORITE_REVIEWS_VS_NAV_PINS_COMPACT_LINE,
    currentLink: FAVORITE_REVIEWS_VS_NAV_PINS_FAVORITES_LINK,
    peerLink: FAVORITE_REVIEWS_VS_NAV_PINS_NAV_PINS_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildFavoriteReviewsVsNavPinsVocabulary(): FavoriteReviewsVsNavPinsVocabularyModel {
  const rail = buildFavoriteReviewsVsNavPinsPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    favoriteReviewsLink: rail.currentLink,
    navPinsLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveFavoriteReviewsVsNavPinsPeerLink(
  currentSurfaceId: FavoriteReviewsVsNavPinsSurfaceId,
): FavoriteReviewsVsNavPinsLink {
  if (currentSurfaceId === "favorite-reviews") {
    return FAVORITE_REVIEWS_VS_NAV_PINS_NAV_PINS_LINK;
  }

  return FAVORITE_REVIEWS_VS_NAV_PINS_FAVORITES_LINK;
}
