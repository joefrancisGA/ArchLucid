"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { PILOT_GUIDE_HELP_PRIMARY_ACTIONS } from "@/lib/pilot-guide-help-guide-content";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpPilotGuideHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/pilot-guide` (HP). */
export function HelpPilotGuideHeaderActions(props: HelpPilotGuideHeaderActionsProps): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-pilot-guide-header-actions">
      <Button asChild size="sm" variant="primary" data-testid="help-pilot-guide-start-review">
        <Link href={PILOT_GUIDE_HELP_PRIMARY_ACTIONS.startReview.href}>
          {PILOT_GUIDE_HELP_PRIMARY_ACTIONS.startReview.label}
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link href={PILOT_GUIDE_HELP_PRIMARY_ACTIONS.firstArchitectureReview.href}>
          {PILOT_GUIDE_HELP_PRIMARY_ACTIONS.firstArchitectureReview.label}
        </Link>
      </Button>
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      {buyerPolishedShell ? null : <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />}
    </div>
  );
}
