"use client";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import { CONTACT_SUPPORT_PRIMARY_ACTIONS } from "@/lib/contact-support-help-guide-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpContactSupportHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/contact-support` (ECO). */
export function HelpContactSupportHeaderActions(
  props: HelpContactSupportHeaderActionsProps,
): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-contact-support-header-actions">
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      <Button asChild size="sm" variant="primary" data-testid="help-contact-support-email-action">
        <a href={CONTACT_SUPPORT_PRIMARY_ACTIONS.emailSupport.href}>
          {CONTACT_SUPPORT_PRIMARY_ACTIONS.emailSupport.label}
        </a>
      </Button>
      {buyerPolishedShell ? null : <HelpTopicPrintButton entry={props.entry} />}
    </div>
  );
}
