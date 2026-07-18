"use client";

import { Button } from "@/components/ui/button";
import { printHelpTopicPage } from "@/lib/help-topic-print";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpTopicPrintButtonProps = {
  readonly entry: ProductDocumentationEntry;
};

export function HelpTopicPrintButton(props: HelpTopicPrintButtonProps): React.ReactElement | null {
  const { entry } = props;

  if (entry.pdfStatus !== "public") {
    return null;
  }

  return (
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
  );
}
