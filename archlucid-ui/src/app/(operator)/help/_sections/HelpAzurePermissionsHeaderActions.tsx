"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION } from "@/lib/azure-permissions-help-evidence-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpAzurePermissionsHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
  readonly setupHref: string;
};

/** Header actions for `/help/azure-permissions` (HE). */
export function HelpAzurePermissionsHeaderActions(
  props: HelpAzurePermissionsHeaderActionsProps,
): React.ReactElement {
  const { entry, setupHref } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-azure-permissions-header-actions">
      <Button asChild size="sm" variant="primary" data-testid={AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION.testId}>
        <Link href={setupHref}>{AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION.label}</Link>
      </Button>
      {buyerPolishedShell ? null : (
        <>
          <PageContextualHelpButton />
          <HelpTopicPrintButton entry={entry} />
        </>
      )}
    </div>
  );
}
