"use client";

import { Star } from "lucide-react";

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
 * Star toggle to pin an architecture review for quick return (TB-2206).
 * Persists in localStorage via {@link useFavoriteReviews}.
 */
export function FavoriteReviewToggle(props: FavoriteReviewToggleProps): React.JSX.Element {
  const { isFavorite, toggleFavorite } = useFavoriteReviews();
  const favorited = isFavorite(props.runId);
  const label = favorited ? "Unpin architecture review" : "Pin architecture review";
  const size = props.size ?? "icon";

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={cn(
        size === "icon" ? "h-8 w-8 shrink-0 p-0" : "gap-1",
        favorited ? "border-al-accent-interactive text-al-accent-interactive" : "text-neutral-500",
        props.className,
      )}
      aria-label={label}
      aria-pressed={favorited}
      title={label}
      data-testid="favorite-review-toggle"
      data-favorited={favorited ? "true" : "false"}
      data-run-id={props.runId}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite({ runId: props.runId, title: props.title });
      }}
    >
      <Star
        className={cn("h-4 w-4", favorited ? "fill-current" : null)}
        aria-hidden
      />
      {size === "sm" ? <span>{favorited ? "Pinned" : "Pin"}</span> : null}
    </Button>
  );
}