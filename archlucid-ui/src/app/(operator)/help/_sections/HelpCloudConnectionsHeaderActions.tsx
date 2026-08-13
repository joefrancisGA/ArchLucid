"use client";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpCloudConnectionsHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Contextual help and print actions for `/help/cloud-connections` (HCE). */
export function HelpCloudConnectionsHeaderActions(
  props: HelpCloudConnectionsHeaderActionsProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-cloud-connections-header-actions">
      <PageContextualHelpButton />
      <HelpTopicPrintButton entry={entry} />
    </div>
  );
}
