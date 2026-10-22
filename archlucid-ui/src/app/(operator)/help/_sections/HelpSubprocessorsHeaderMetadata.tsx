import {
  formatSubprocessorsHelpReviewedCopy,
  SUBPROCESSORS_HELP_REGISTER_STATUS_LABEL,
} from "@/lib/subprocessors-help-evidence-copy";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpSubprocessorsHeaderMetadataProps = {
  readonly entry: ProductDocumentationEntry;
};

export function HelpSubprocessorsHeaderMetadata(
  props: HelpSubprocessorsHeaderMetadataProps,
): React.ReactElement | null {
  const { entry } = props;
  const lastReviewed = entry.lastReviewed?.trim() ?? "";

  if (lastReviewed.length === 0) {
    return null;
  }

  return (
    <>
      <StatusTag
        kind="ready"
        label={SUBPROCESSORS_HELP_REGISTER_STATUS_LABEL}
        data-testid="help-subprocessors-header-status"
      />
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}
        data-testid="help-subprocessors-header-metadata"
      >
        {formatSubprocessorsHelpReviewedCopy(lastReviewed)}
      </p>
    </>
  );
}
