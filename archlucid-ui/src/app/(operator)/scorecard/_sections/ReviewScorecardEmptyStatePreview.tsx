import { cn } from "@/lib/utils";

import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEW_SCORECARD_EMPTY_PREVIEW_ITEMS,
  REVIEW_SCORECARD_EMPTY_PREVIEW_SECTION_TITLE,
} from "@/lib/review-scorecard-empty-state";

/** Muted preview tiles for the review scorecard empty state. */
export function ReviewScorecardEmptyStatePreview(): React.JSX.Element {
  return (
    <section
      aria-labelledby="review-scorecard-empty-preview-heading"
      data-testid="review-scorecard-empty-preview"
    >
      <h2 id="review-scorecard-empty-preview-heading" className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>
        {REVIEW_SCORECARD_EMPTY_PREVIEW_SECTION_TITLE}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REVIEW_SCORECARD_EMPTY_PREVIEW_ITEMS.map((item) => (
          <div
            key={item}
            className="rounded-md border border-neutral-200/80 bg-neutral-50/60 px-3 py-3 dark:border-neutral-800/80 dark:bg-neutral-950/40"
          >
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{item}</p>
            <p className={cn("m-0 mt-1 text-al-text-secondary/60", OPERATOR_TYPOGRAPHY.kpiValue)}>—</p>
          </div>
        ))}
      </div>
    </section>
  );
}
