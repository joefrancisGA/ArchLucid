"use client";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpSecurityTrustHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/security-trust` (HSE). */
export function HelpSecurityTrustHeaderActions(
  props: HelpSecurityTrustHeaderActionsProps,
): React.JSX.Element | null {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-security-trust-header-actions">
      <PageContextualHelpButton />
      <HelpTopicPrintButton entry={props.entry} />
    </div>
  );
}
