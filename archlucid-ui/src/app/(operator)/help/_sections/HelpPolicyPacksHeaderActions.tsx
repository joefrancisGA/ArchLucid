"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { POLICY_PACKS_HELP_PRIMARY_ACTION } from "@/lib/policy/policy-packs-help-evidence-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpPolicyPacksHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/policy-packs` (HEO). */
export function HelpPolicyPacksHeaderActions(props: HelpPolicyPacksHeaderActionsProps): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-policy-packs-header-actions">
      <Button asChild size="sm" variant="primary" data-testid={POLICY_PACKS_HELP_PRIMARY_ACTION.testId}>
        <Link href={POLICY_PACKS_HELP_PRIMARY_ACTION.href}>{POLICY_PACKS_HELP_PRIMARY_ACTION.label}</Link>
      </Button>
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      {buyerPolishedShell ? null : (
        <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />
      )}
    </div>
  );
}
