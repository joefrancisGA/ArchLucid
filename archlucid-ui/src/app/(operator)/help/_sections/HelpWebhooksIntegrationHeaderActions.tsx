"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION } from "@/lib/webhooks-integration-help-guide-content";

type HelpWebhooksIntegrationHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Primary CTA, role tag, and print for `/help/webhooks-integration` (HEW). */
export function HelpWebhooksIntegrationHeaderActions(
  props: HelpWebhooksIntegrationHeaderActionsProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-webhooks-integration-header-actions">
      <Button asChild data-testid="help-webhooks-integration-primary-cta" size="sm" variant="primary">
        <Link href={WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION.href}>
          {WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION.label}
        </Link>
      </Button>
      <StatusTag kind="neutral" label="Alert routing role" data-testid="help-webhooks-integration-role-tag" />
      <HelpTopicPrintButton entry={entry} />
    </div>
  );
}
