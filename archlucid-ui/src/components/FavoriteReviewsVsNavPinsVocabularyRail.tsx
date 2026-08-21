"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildFavoriteReviewsVsNavPinsPairwiseRail,
  type FavoriteReviewsVsNavPinsSurfaceId,
  type FavoriteReviewsVsNavPinsVocabularyModel,
} from "@/lib/vocabulary/favorite-reviews-vs-nav-pins-vocabulary";

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
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.favoriteReviewsLink,
          peerLink: props.model.navPinsLink,
        }
      : buildFavoriteReviewsVsNavPinsPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="favorite-reviews-vs-nav-pins-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
