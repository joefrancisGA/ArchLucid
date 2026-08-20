"use client";

import type { JSX } from "react";

import {
  buildFavoriteReviewsVsNavPinsVocabulary,
  resolveFavoriteReviewsVsNavPinsPeerLink,
  type FavoriteReviewsVsNavPinsSurfaceId,
  type FavoriteReviewsVsNavPinsVocabularyModel,
} from "@/lib/vocabulary/favorite-reviews-vs-nav-pins-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type FavoriteReviewsVsNavPinsVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: FavoriteReviewsVsNavPinsSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildFavoriteReviewsVsNavPinsVocabulary}. */
  readonly model?: FavoriteReviewsVsNavPinsVocabularyModel;
};

/**
 * TB-2269 — Compact vocabulary rail between pinned architecture packages and nav route pins.
 * Mount on Reviews hub pinned reviews and NavPinnedLinksPanel.
 */
export function FavoriteReviewsVsNavPinsVocabularyRail(
  props: FavoriteReviewsVsNavPinsVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildFavoriteReviewsVsNavPinsVocabulary();
  const peer = resolveFavoriteReviewsVsNavPinsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "favorite-reviews"
      ? model.favoriteReviewsLink
      : model.navPinsLink;

  return (
    <VocabularyRail
      testIdPrefix="favorite-reviews-vs-nav-pins-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      compactLinkPlacement="inline"
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
