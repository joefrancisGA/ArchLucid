import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS } from "@/lib/data-handling-tenant-isolation-help-guide-content";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpDataHandlingTenantIsolationHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Primary diligence CTA and print export for `/help/data-handling`. */
export function HelpDataHandlingTenantIsolationHeaderActions(
  props: HelpDataHandlingTenantIsolationHeaderActionsProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="help-data-handling-tenant-isolation-header-actions"
    >
      <Button asChild size="sm" variant="primary">
        <Link href={DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openTrustCenter.href}>
          {DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openTrustCenter.label}
        </Link>
      </Button>
      <HelpTopicPrintButton entry={entry} />
    </div>
  );
}
