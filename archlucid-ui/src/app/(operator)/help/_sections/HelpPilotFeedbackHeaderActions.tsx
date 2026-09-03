"use client";

import Link from "next/link";

import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DESIGN_TOKENS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  PILOT_FEEDBACK_HELP_PRIMARY_ACTION,
  PILOT_FEEDBACK_HELP_SECONDARY_ACTIONS,
} from "@/lib/pilot-feedback-help-guide-content";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpPilotFeedbackHeaderActionsProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Header actions for `/help/pilot-feedback` (HPE). */
export function HelpPilotFeedbackHeaderActions(props: HelpPilotFeedbackHeaderActionsProps): React.JSX.Element {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-pilot-feedback-header-actions">
      <Button asChild size="sm" variant="primary" data-testid="help-pilot-feedback-primary-cta">
        <Link href={PILOT_FEEDBACK_HELP_PRIMARY_ACTION.href}>{PILOT_FEEDBACK_HELP_PRIMARY_ACTION.label}</Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link href={PILOT_FEEDBACK_HELP_SECONDARY_ACTIONS.startReview.href}>
          {PILOT_FEEDBACK_HELP_SECONDARY_ACTIONS.startReview.label}
        </Link>
      </Button>
      <Link
        href={PILOT_FEEDBACK_HELP_SECONDARY_ACTIONS.pilotGuide.href}
        className={cn(
          "text-sm underline-offset-2 hover:underline",
          DESIGN_TOKENS.accent.link,
          OPERATOR_TYPOGRAPHY.body,
        )}
      >
        {PILOT_FEEDBACK_HELP_SECONDARY_ACTIONS.pilotGuide.label}
      </Link>
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      {buyerPolishedShell ? null : <HelpTopicPrintButton entry={entry} allowWithoutServerPdf={entry.pdfStatus === null} />}
    </div>
  );
}
