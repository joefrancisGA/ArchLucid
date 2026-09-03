"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_ACTION } from "@/lib/specialty-walkthroughs-help-guide-content";

type HelpSpecialtyWalkthroughHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/specialty-walkthroughs` (HS). */
export function HelpSpecialtyWalkthroughHeaderActions(
  props: HelpSpecialtyWalkthroughHeaderActionsProps,
): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-specialty-walkthroughs-header-actions">
      <Button asChild size="sm" variant="primary" data-testid={SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_ACTION.testId}>
        <Link href={SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_ACTION.href}>
          {SPECIALTY_WALKTHROUGHS_HELP_PRIMARY_ACTION.label}
        </Link>
      </Button>
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      {buyerPolishedShell ? null : (
        <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />
      )}
    </div>
  );
}
