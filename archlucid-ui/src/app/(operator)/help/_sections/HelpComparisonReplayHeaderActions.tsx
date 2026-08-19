"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import { COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS } from "@/lib/comparison-replay-help-guide-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpComparisonReplayHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/comparison-replay` (CO). */
export function HelpComparisonReplayHeaderActions(
  props: HelpComparisonReplayHeaderActionsProps,
): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-comparison-replay-header-actions">
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      <Button asChild size="sm" variant="primary" data-testid="help-comparison-replay-compare-action">
        <Link href={COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS.compareTwoReviews.href}>
          {COMPARISON_REPLAY_HELP_PRIMARY_ACTIONS.compareTwoReviews.label}
        </Link>
      </Button>
      {buyerPolishedShell ? null : <HelpTopicPrintButton entry={props.entry} />}
    </div>
  );
}
