"use client";

import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { printHelpTopicPage } from "@/lib/help-topic-print";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpAzurePermissionsHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Contextual help, PDF, and print actions for `/help/azure-permissions`. */
export function HelpAzurePermissionsHeaderActions(
  props: HelpAzurePermissionsHeaderActionsProps,
): React.ReactElement | null {
  const { entry } = props;

  if (entry.pdfStatus === null) {
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid="help-azure-permissions-header-actions">
        <PageContextualHelpButton />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-azure-permissions-header-actions">
      <PageContextualHelpButton />
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
