"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import {
  CONNECT_GCP_SECURELY_CONFIGURE_ACTION,
  CONNECT_GCP_SECURELY_CONFIGURE_HREF,
} from "@/lib/connect-gcp-securely-help-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpConnectGcpSecurelyHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/cloud-connections/gcp` (HGC). */
export function HelpConnectGcpSecurelyHeaderActions(
  props: HelpConnectGcpSecurelyHeaderActionsProps,
): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-connect-gcp-securely-header-actions">
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      <Button asChild size="sm" variant="primary" data-testid="connect-gcp-configure-action">
        <Link href={CONNECT_GCP_SECURELY_CONFIGURE_HREF}>{CONNECT_GCP_SECURELY_CONFIGURE_ACTION}</Link>
      </Button>
      {buyerPolishedShell ? null : <HelpTopicPrintButton entry={props.entry} />}
    </div>
  );
}
