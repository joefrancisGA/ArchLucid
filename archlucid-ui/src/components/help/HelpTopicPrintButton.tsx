"use client";

import { Button } from "@/components/ui/button";
import { printHelpTopicPage } from "@/lib/help/help-topic-print";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpTopicPrintButtonProps = {
  readonly entry: ProductDocumentationEntry;
  /** When true, still offer browser print even when the topic has no server PDF (`pdfStatus` null). */
  readonly allowWithoutServerPdf?: boolean;
  /** Optional async prep (e.g. expand collapsed catalog) before `window.print()`. */
  readonly onBeforePrint?: () => void | Promise<void>;
};

export function HelpTopicPrintButton(props: HelpTopicPrintButtonProps): React.ReactElement | null {
  const { entry, allowWithoutServerPdf = false, onBeforePrint } = props;

  if (entry.pdfStatus === null) {
    if (!allowWithoutServerPdf) {
      return null;
    }
  } else if (entry.pdfStatus !== "public" && entry.pdfStatus !== "customer") {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-testid="help-topic-print-pdf"
      onClick={() => {
        void (async () => {
          if (onBeforePrint !== undefined) {
            await onBeforePrint();
          }

          printHelpTopicPage();
        })();
      }}
    >
      Print / Save as PDF
    </Button>
  );
}
