"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { CONNECTION_STATUS_HELP_PRIMARY_ACTION } from "@/lib/connection-status-help-guide-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpConnectionStatusHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/connection-status` (HCO). */
export function HelpConnectionStatusHeaderActions(
  props: HelpConnectionStatusHeaderActionsProps,
): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-connection-status-header-actions">
      <Button asChild data-testid={CONNECTION_STATUS_HELP_PRIMARY_ACTION.testId} size="sm" variant="primary">
        <Link href={CONNECTION_STATUS_HELP_PRIMARY_ACTION.href}>
          {CONNECTION_STATUS_HELP_PRIMARY_ACTION.label}
        </Link>
      </Button>
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      {buyerPolishedShell ? null : (
        <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />
      )}
    </div>
  );
}
