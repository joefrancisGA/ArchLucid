"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { EVIDENCE_INTAKE_HELP_PRIMARY_ACTION } from "@/lib/evidence-intake-help-evidence-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpEvidenceIntakeHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/evidence-intake` (EVI). */
export function HelpEvidenceIntakeHeaderActions(props: HelpEvidenceIntakeHeaderActionsProps): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-evidence-intake-header-actions">
      <Button asChild size="sm" variant="primary" data-testid={EVIDENCE_INTAKE_HELP_PRIMARY_ACTION.testId}>
        <Link href={EVIDENCE_INTAKE_HELP_PRIMARY_ACTION.href}>{EVIDENCE_INTAKE_HELP_PRIMARY_ACTION.label}</Link>
      </Button>
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      {buyerPolishedShell ? null : (
        <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />
      )}
    </div>
  );
}
