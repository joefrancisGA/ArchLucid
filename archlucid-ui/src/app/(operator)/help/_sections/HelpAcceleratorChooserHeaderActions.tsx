"use client";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpAcceleratorChooserHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Print action for accelerator chooser help — print remains when pdfStatus is null (HAX). */
export function HelpAcceleratorChooserHeaderActions(
  props: HelpAcceleratorChooserHeaderActionsProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-accelerator-chooser-header-actions">
      <HelpTopicPrintButton entry={entry} allowWithoutServerPdf />
    </div>
  );
}
