"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildFavoriteReviewsVsNavPinsVocabulary,
  resolveFavoriteReviewsVsNavPinsPeerLink,
  type FavoriteReviewsVsNavPinsSurfaceId,
  type FavoriteReviewsVsNavPinsVocabularyModel,
} from "@/lib/favorite-reviews-vs-nav-pins-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildFavoriteReviewsVsNavPinsVocabulary();
  const peer = resolveFavoriteReviewsVsNavPinsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "favorite-reviews"
      ? model.favoriteReviewsLink
      : model.navPinsLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="favorite-reviews-vs-nav-pins-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="favorite-reviews-vs-nav-pins-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="favorite-reviews-vs-nav-pins-vocabulary-heading"
      data-testid="favorite-reviews-vs-nav-pins-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="favorite-reviews-vs-nav-pins-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyTwo}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span
          className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="favorite-reviews-vs-nav-pins-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="favorite-reviews-vs-nav-pins-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
