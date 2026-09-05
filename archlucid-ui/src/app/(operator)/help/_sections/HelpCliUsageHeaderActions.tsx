"use client";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpCliUsageHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/cli-usage` (HCX). */
export function HelpCliUsageHeaderActions(props: HelpCliUsageHeaderActionsProps): React.JSX.Element | null {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-cli-usage-header-actions">
      <PageContextualHelpButton />
      <HelpTopicPrintButton entry={props.entry} />
    </div>
  );
}
