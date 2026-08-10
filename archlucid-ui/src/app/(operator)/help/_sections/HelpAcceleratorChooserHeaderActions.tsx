"use client";

import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { Button } from "@/components/ui/button";
import { printHelpTopicPage } from "@/lib/help-topic-print";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpAcceleratorChooserHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** PDF / print actions for accelerator chooser help — omitted when the registry has no pdfStatus. */
export function HelpAcceleratorChooserHeaderActions(
  props: HelpAcceleratorChooserHeaderActionsProps,
): React.ReactElement | null {
  const { entry } = props;

  if (entry.pdfStatus === null) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-accelerator-chooser-header-actions">
      <HelpTopicPdfDownloadButton entry={entry} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="help-topic-print-pdf"
        onClick={() => {
          printHelpTopicPage();
        }}
      >
        Print / Save as PDF
      </Button>
    </div>
  );
}
