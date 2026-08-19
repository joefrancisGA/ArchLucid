"use client";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpAzurePermissionsHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Contextual help and print actions for `/help/azure-permissions`. */
export function HelpAzurePermissionsHeaderActions(
  props: HelpAzurePermissionsHeaderActionsProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-azure-permissions-header-actions">
      <PageContextualHelpButton />
      <HelpTopicPrintButton entry={entry} />
    </div>
  );
}
