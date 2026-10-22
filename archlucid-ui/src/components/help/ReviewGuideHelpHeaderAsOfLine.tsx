import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { formatReviewGuideHelpProvenanceLine } from "@/lib/review-guide-help-guide-content";
import { cn } from "@/lib/utils";

type ReviewGuideHelpHeaderAsOfLineProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Title-block as-of line for `/help/review-guide` (HR). */
export function ReviewGuideHelpHeaderAsOfLine(
  props: ReviewGuideHelpHeaderAsOfLineProps,
): React.JSX.Element | null {
  const provenance = formatReviewGuideHelpProvenanceLine(props.entry);

  if (provenance === null) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}
      data-testid="help-review-guide-provenance"
    >
      {provenance}
    </p>
  );
}
