"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS } from "@/lib/sponsor/sponsor-report-help-guide-content";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpSponsorSummaryHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/sponsor-report` (EXE). */
export function HelpSponsorSummaryHeaderActions(props: HelpSponsorSummaryHeaderActionsProps): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-sponsor-report-header-actions">
      <Button asChild size="sm" variant="primary" data-testid="help-sponsor-report-start-review">
        <Link href={SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS.startFirstReview.href}>
          {SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS.startFirstReview.label}
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link href={SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS.openSponsorValueReport.href}>
          {SPONSOR_SUMMARY_HELP_PRIMARY_ACTIONS.openSponsorValueReport.label}
        </Link>
      </Button>
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      {buyerPolishedShell ? null : <HelpTopicPrintButton entry={entry} />}
    </div>
  );
}
