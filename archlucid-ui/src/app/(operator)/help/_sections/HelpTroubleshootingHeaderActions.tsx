"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { TROUBLESHOOTING_HELP_PRIMARY_ACTION } from "@/lib/troubleshooting-help-guide-content";

type HelpTroubleshootingHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/troubleshooting` (HTX). */
export function HelpTroubleshootingHeaderActions(
  props: HelpTroubleshootingHeaderActionsProps,
): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-troubleshooting-header-actions">
      <Button asChild size="sm" variant="primary" data-testid={TROUBLESHOOTING_HELP_PRIMARY_ACTION.testId}>
        <Link href={TROUBLESHOOTING_HELP_PRIMARY_ACTION.href}>{TROUBLESHOOTING_HELP_PRIMARY_ACTION.label}</Link>
      </Button>
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      {buyerPolishedShell ? null : (
        <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />
      )}
    </div>
  );
}
