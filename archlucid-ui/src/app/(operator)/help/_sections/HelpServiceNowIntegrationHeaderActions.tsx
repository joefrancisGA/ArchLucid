"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION } from "@/lib/servicenow-integration-help-guide-content";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpServiceNowIntegrationHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/servicenow-integration` (ESX). */
export function HelpServiceNowIntegrationHeaderActions(
  props: HelpServiceNowIntegrationHeaderActionsProps,
): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-servicenow-integration-header-actions">
      <Button asChild size="sm" variant="primary" data-testid={SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.testId}>
        <Link href={SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.href}>
          {SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.label}
        </Link>
      </Button>
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      {buyerPolishedShell ? null : (
        <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />
      )}
    </div>
  );
}
