import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  COMPARE_DIMENSION_PREVIEW_ITEMS,
  COMPARE_EMPTY_OUTPUT_BODY,
  COMPARE_EMPTY_OUTPUT_TITLE,
} from "@/app/(operator)/insights/compare-two-reviews/_sections/compare-workspace-copy";

export type CompareEmptyResultsPlaceholderProps = {
  readonly className?: string;
};

/** Muted comparison output panel shown before a compare request returns results. */
export function CompareEmptyResultsPlaceholder(props: CompareEmptyResultsPlaceholderProps) {
  const { className } = props;

  return (
    <section
      aria-label={COMPARE_EMPTY_OUTPUT_TITLE}
      className={cn(
        "max-w-3xl rounded-md border border-dashed border-neutral-300 bg-neutral-50/40 px-4 py-4 dark:border-neutral-700 dark:bg-neutral-900/25",
        className,
      )}
      data-testid="compare-empty-output-panel"
    >
      <h2 className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.cardTitle)}>{COMPARE_EMPTY_OUTPUT_TITLE}</h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{COMPARE_EMPTY_OUTPUT_BODY}</p>
      <ul
        className={cn(
          "m-0 mt-3 grid list-none gap-1.5 p-0 sm:grid-cols-2",
          OPERATOR_TYPOGRAPHY.helper,
        )}
        aria-hidden
      >
        {COMPARE_DIMENSION_PREVIEW_ITEMS.map((item) => (
          <li key={item.id} className="text-al-text-secondary">
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
