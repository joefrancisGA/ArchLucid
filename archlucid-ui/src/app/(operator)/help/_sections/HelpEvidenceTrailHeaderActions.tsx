"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { EVIDENCE_TRAIL_HELP_PRIMARY_ACTION } from "@/lib/evidence-trail-help-evidence-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpEvidenceTrailHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/evidence-trail` (EV). */
export function HelpEvidenceTrailHeaderActions(props: HelpEvidenceTrailHeaderActionsProps): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-topic-export-actions">
      <Button asChild size="sm" variant="primary" data-testid={EVIDENCE_TRAIL_HELP_PRIMARY_ACTION.testId}>
        <Link href={EVIDENCE_TRAIL_HELP_PRIMARY_ACTION.href}>{EVIDENCE_TRAIL_HELP_PRIMARY_ACTION.label}</Link>
      </Button>
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      {buyerPolishedShell ? null : (
        <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />
      )}
    </div>
  );
}
