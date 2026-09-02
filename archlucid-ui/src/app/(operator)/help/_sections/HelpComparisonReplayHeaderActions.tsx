"use client";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpComparisonReplayHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/comparison-replay` (CO). */
export function HelpComparisonReplayHeaderActions(
  props: HelpComparisonReplayHeaderActionsProps,
): React.JSX.Element | null {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-comparison-replay-header-actions">
      <HelpTopicPrintButton entry={props.entry} />
    </div>
  );
}
