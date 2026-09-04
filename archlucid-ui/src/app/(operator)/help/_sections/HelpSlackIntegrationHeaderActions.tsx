"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { SLACK_INTEGRATION_HELP_PRIMARY_ACTION } from "@/lib/slack-integration-help-guide-content";

/** Header actions for `/help/slack-integration` (HSL). */
export function HelpSlackIntegrationHeaderActions(): React.JSX.Element | null {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-slack-integration-header-actions">
      <Button asChild size="sm" variant="primary">
        <Link href={SLACK_INTEGRATION_HELP_PRIMARY_ACTION.href}>{SLACK_INTEGRATION_HELP_PRIMARY_ACTION.label}</Link>
      </Button>
      <PageContextualHelpButton />
    </div>
  );
}
