"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION } from "@/lib/architecture-intelligence-help-guide-content";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpArchitectureIntelligenceHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/architecture-intelligence` (EAR). */
export function HelpArchitectureIntelligenceHeaderActions(
  props: HelpArchitectureIntelligenceHeaderActionsProps,
): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-architecture-intelligence-header-actions">
      <Button asChild size="sm" variant="primary" data-testid={ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.testId}>
        <Link href={ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.href}>
          {ARCHITECTURE_INTELLIGENCE_HELP_PRIMARY_ACTION.label}
        </Link>
      </Button>
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      {buyerPolishedShell ? null : (
        <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />
      )}
    </div>
  );
}
