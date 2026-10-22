"use client";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpAzureBoardsHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Contextual help and print for `/help/azure-boards` (HEZ). */
export function HelpAzureBoardsHeaderActions(
  props: HelpAzureBoardsHeaderActionsProps,
): React.JSX.Element | null {
  if (isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-azure-boards-header-actions">
      <PageContextualHelpButton />
      <HelpTopicPrintButton entry={props.entry} />
    </div>
  );
}
