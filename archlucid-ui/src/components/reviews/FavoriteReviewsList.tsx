"use client";

import Link from "next/link";

import { FavoriteReviewToggle } from "@/components/reviews/FavoriteReviewToggle";
import { useFavoriteReviews } from "@/hooks/use-favorite-reviews";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type FavoriteReviewsListProps = {
  readonly className?: string;
  readonly heading?: string;
};

const DEFAULT_HEADING = "Pinned reviews";

/** Lists localStorage favorites with deep links into architecture reviews (TB-2206). Hidden when empty. */
export function FavoriteReviewsList(props: FavoriteReviewsListProps): React.JSX.Element | null {
  const { favorites } = useFavoriteReviews();
  const heading = props.heading ?? DEFAULT_HEADING;

  if (favorites.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("space-y-2", props.className)}
      data-testid="favorite-reviews-list"
      aria-label={heading}
    >
      <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {heading}
      </h2>

      <ul className="m-0 list-none space-y-1 p-0">
        {favorites.map((row) => {
          const href = reviewDetailPath(row.runId);
          const label =
            row.title !== undefined && row.title.trim().length > 0
              ? row.title.trim()
              : row.runId;

          return (
            <li
              key={row.runId}
              className="flex items-center gap-2 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800"
              data-testid={`favorite-reviews-item-${row.runId}`}
            >
              <Link
                href={href}
                className={cn(OPERATOR_LINK.nav, "min-w-0 flex-1 truncate font-medium")}
                data-testid={`favorite-reviews-link-${row.runId}`}
              >
                {label}
              </Link>
              <FavoriteReviewToggle runId={row.runId} title={row.title} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}