import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { REVIEWS_HUB_INCLUDES_ITEMS, REVIEWS_HUB_INCLUDES_LEAD, REVIEWS_HUB_INCLUDES_TITLE } from "./reviews-hub-copy";

/** Compact reminder of review outputs on `/architecture/reviews`. */
export function ReviewsHubPackageIncludes(): React.JSX.Element {
  return (
    <section className="mt-4" data-testid="reviews-hub-package-includes">
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{REVIEWS_HUB_INCLUDES_TITLE}</h2>
      <p className={cn("m-0 mt-2 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {REVIEWS_HUB_INCLUDES_LEAD}
      </p>
      <ul
        className={cn(
          "m-0 mt-3 flex list-none flex-wrap gap-2 p-0",
          OPERATOR_TYPOGRAPHY.helper,
        )}
        aria-label="Review deliverables"
      >
        {REVIEWS_HUB_INCLUDES_ITEMS.map((item) => (
          <li
            key={item}
            className="rounded-md border border-neutral-200 bg-neutral-50/80 px-2.5 py-1 text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900/50"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
