"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useLatestSnapshotCaptureIsPartial } from "@/hooks/use-latest-snapshot-capture-partial";
import { ARCHITECTURE_COMPARE_PARTIAL_SECURENOW_INVENTORY_FOOTNOTE } from "@/lib/architecture/architecture-compare-partial-inventory-footnote-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function CompareResultsPanelPartialInventoryFootnote(props: {
  readonly visible: boolean;
}): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const partialCapture = useLatestSnapshotCaptureIsPartial(productLine === "security");

  if (!props.visible || productLine !== "security" || !partialCapture) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="compare-results-partial-inventory-footnote"
    >
      {ARCHITECTURE_COMPARE_PARTIAL_SECURENOW_INVENTORY_FOOTNOTE}
    </p>
  );
}