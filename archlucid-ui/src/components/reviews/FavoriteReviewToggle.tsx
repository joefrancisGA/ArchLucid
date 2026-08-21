"use client";

import type { MouseEvent } from "react";

import { ReviewPinGlyph } from "@/components/reviews/ReviewPinGlyph";
import { Button } from "@/components/ui/button";
import { useFavoriteReviews } from "@/hooks/use-favorite-reviews";
import { cn } from "@/lib/utils";

type FavoriteReviewToggleProps = {
  readonly runId: string;
  readonly title?: string;
  readonly className?: string;
  readonly size?: "sm" | "icon";
};

/**
 * Pin toggle for architecture reviews (TB-2206).
 * Unfilled pin = not pinned; filled pin = pinned. Persists via {@link useFavoriteReviews}.
 */
export function FavoriteReviewToggle(props: FavoriteReviewToggleProps): React.JSX.Element {
  const { isFavorite, toggleFavorite } = useFavoriteReviews();
  const favorited = isFavorite(props.runId);
  const label = favorited ? "Unpin architecture review" : "Pin architecture review";
  const size = props.size ?? "icon";

  const onToggle = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite({ runId: props.runId, title: props.title });
  };

  switch (size) {
    case "sm":
      return (
        <Button
          type="button"
          variant="outline"
          size={size}
          className={cn(
            "gap-1",
            favorited ? "border-al-accent-interactive text-al-accent-interactive" : "text-neutral-500",
            props.className,
          )}
          aria-label={label}
          aria-pressed={favorited}
          data-testid="favorite-review-toggle"
          data-favorited={favorited ? "true" : "false"}
          data-run-id={props.runId}
          onClick={onToggle}
        >
          <ReviewPinGlyph filled={favorited} />
          <span>{favorited ? "Pinned" : "Pin"}</span>
        </Button>
      );
    case "icon":
      return (
        <button
          type="button"
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:text-al-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
            favorited ? "text-al-accent-interactive" : null,
            props.className,
          )}
          aria-label={label}
          aria-pressed={favorited}
          data-testid="favorite-review-toggle"
          data-favorited={favorited ? "true" : "false"}
          data-run-id={props.runId}
          onClick={onToggle}
        >
          <ReviewPinGlyph filled={favorited} />
        </button>
      );
    default: {
      const _exhaustive: never = size;
      return _exhaustive;
    }
  }
}
