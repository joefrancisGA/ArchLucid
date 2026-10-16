"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { cloudConnectionsHelpPrimaryCta } from "@/lib/cloud-connections-help-guide-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpCloudConnectionsHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Contextual help and print actions for `/help/cloud-connections` (HCE). */
export function HelpCloudConnectionsHeaderActions(
  props: HelpCloudConnectionsHeaderActionsProps,
): React.ReactElement {
  const { entry } = props;
  const { productLine } = useProductLine();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const primaryCta = cloudConnectionsHelpPrimaryCta(productLine);

  if (buyerPolishedShell) {
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid="help-cloud-connections-header-actions">
        <Button asChild size="sm" variant="primary" data-testid="help-cloud-connections-header-primary-cta">
          <Link href={primaryCta.href}>{primaryCta.label}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-cloud-connections-header-actions">
      <PageContextualHelpButton />
      <HelpTopicPrintButton entry={entry} />
    </div>
  );
}
