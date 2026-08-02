import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { COMPARE_DIMENSION_PREVIEW_ITEMS } from "@/app/(operator)/insights/compare-two-reviews/_sections/compare-workspace-copy";

/** Compact preview of what a review comparison will surface — helps buyers grasp value before selecting reviews. */
export function CompareComparisonDimensionsPreview() {
  return (
    <section
      aria-label="What comparison shows"
      className="max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/60 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="compare-dimensions-preview"
    >
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>What you will see</h2>
      <ul className="m-0 mt-2 grid list-none gap-2 p-0 sm:grid-cols-2">
        {COMPARE_DIMENSION_PREVIEW_ITEMS.map((item) => (
          <li
            key={item.id}
            className="rounded-md border border-neutral-200/80 bg-white/80 px-3 py-2 dark:border-neutral-700/80 dark:bg-neutral-950/40"
          >
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{item.label}</p>
            <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
