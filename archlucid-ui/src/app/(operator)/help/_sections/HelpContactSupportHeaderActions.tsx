"use client";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpContactSupportHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/contact-support` (ECO). */
export function HelpContactSupportHeaderActions(
  props: HelpContactSupportHeaderActionsProps,
): React.JSX.Element | null {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-contact-support-header-actions">
      <HelpTopicPrintButton entry={props.entry} />
    </div>
  );
}
