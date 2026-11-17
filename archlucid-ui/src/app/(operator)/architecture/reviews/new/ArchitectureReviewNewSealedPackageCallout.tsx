import { ARCHITECTURE_REVIEW_NEW_SEALED_PACKAGE_LINE } from "@/lib/architecture/architecture-review-new-sealed-package-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Reviews /new — starting intake is not yet a sealed tenant package. */
export function ArchitectureReviewNewSealedPackageCallout(): React.JSX.Element {
  return (
    <p
      className={cn(
        "m-0 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      role="status"
      data-testid="architecture-review-new-sealed-package-callout"
    >
      {ARCHITECTURE_REVIEW_NEW_SEALED_PACKAGE_LINE}
    </p>
  );
}
