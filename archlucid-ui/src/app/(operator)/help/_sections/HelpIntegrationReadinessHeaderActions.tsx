"use client";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpIntegrationReadinessHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/integration-readiness` (HEI). */
export function HelpIntegrationReadinessHeaderActions(
  props: HelpIntegrationReadinessHeaderActionsProps,
): React.JSX.Element | null {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-topic-export-actions">
      <PageContextualHelpButton />
      <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />
    </div>
  );
}
