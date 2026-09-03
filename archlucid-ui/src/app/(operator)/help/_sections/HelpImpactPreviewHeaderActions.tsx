"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { IMPACT_PREVIEW_HELP_PRIMARY_ACTION } from "@/lib/impact-preview-help-guide-content";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpImpactPreviewHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/impact-preview` (HEM). */
export function HelpImpactPreviewHeaderActions(
  props: HelpImpactPreviewHeaderActionsProps,
): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-impact-preview-header-actions">
      <Button asChild size="sm" variant="primary" data-testid={IMPACT_PREVIEW_HELP_PRIMARY_ACTION.testId}>
        <Link href={IMPACT_PREVIEW_HELP_PRIMARY_ACTION.href}>{IMPACT_PREVIEW_HELP_PRIMARY_ACTION.label}</Link>
      </Button>
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      {buyerPolishedShell ? null : (
        <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />
      )}
    </div>
  );
}
