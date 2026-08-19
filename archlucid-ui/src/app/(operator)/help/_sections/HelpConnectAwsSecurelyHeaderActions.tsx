"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import {
  CONNECT_AWS_SECURELY_CONFIGURE_ACTION,
  CONNECT_AWS_SECURELY_CONFIGURE_HREF,
} from "@/lib/connect-aws-securely-help-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpConnectAwsSecurelyHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/cloud-connections/aws` (HEC). */
export function HelpConnectAwsSecurelyHeaderActions(
  props: HelpConnectAwsSecurelyHeaderActionsProps,
): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-connect-aws-securely-header-actions">
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      <Button asChild size="sm" variant="primary" data-testid="connect-aws-configure-action">
        <Link href={CONNECT_AWS_SECURELY_CONFIGURE_HREF}>{CONNECT_AWS_SECURELY_CONFIGURE_ACTION}</Link>
      </Button>
      {buyerPolishedShell ? null : <HelpTopicPrintButton entry={props.entry} />}
    </div>
  );
}
