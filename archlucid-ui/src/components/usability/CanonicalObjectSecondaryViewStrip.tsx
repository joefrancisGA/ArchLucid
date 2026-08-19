import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { CanonicalObjectSecondaryViewPresentation } from "@/lib/canonical-object-home-registry";
import { cn } from "@/lib/utils";

export type CanonicalObjectSecondaryViewStripProps = {
  readonly presentation: CanonicalObjectSecondaryViewPresentation;
  readonly testId?: string;
  readonly className?: string;
};

/** Labels a secondary governed-object appearance and links to its canonical home (TB-2153). */
export function CanonicalObjectSecondaryViewStrip(
  props: CanonicalObjectSecondaryViewStripProps,
): React.JSX.Element {
  const { presentation, testId = "canonical-object-secondary-view-strip", className } = props;

  return (
    <aside
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 text-al-text-secondary dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.helper,
        className,
      )}
      data-testid={testId}
      data-canonical-object-type={presentation.objectType}
      data-secondary-surface={presentation.surface}
    >
      <span>
        Viewing from {presentation.surfaceLabel}.{" "}
        <Link
          href={presentation.homeHref}
          className={cn("font-medium", OPERATOR_LINK.inline)}
          data-testid={testId ? `${testId}-home-link` : undefined}
        >
          Open {presentation.homeActionLabel}
        </Link>
      </span>
    </aside>
  );
}
