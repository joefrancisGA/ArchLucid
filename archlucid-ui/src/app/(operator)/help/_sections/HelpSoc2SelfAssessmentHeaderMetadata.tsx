import { formatSoc2SelfAssessmentHelpReviewedCopy } from "@/lib/soc2-self-assessment-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpSoc2SelfAssessmentHeaderMetadataProps = {
  readonly entry: ProductDocumentationEntry;
};

export function HelpSoc2SelfAssessmentHeaderMetadata(
  props: HelpSoc2SelfAssessmentHeaderMetadataProps,
): React.ReactElement | null {
  const { entry } = props;
  const lastReviewed = entry.lastReviewed?.trim() ?? "";

  if (lastReviewed.length === 0) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}
      data-testid="help-soc2-self-assessment-header-metadata"
    >
      {formatSoc2SelfAssessmentHelpReviewedCopy(lastReviewed)}
    </p>
  );
}
