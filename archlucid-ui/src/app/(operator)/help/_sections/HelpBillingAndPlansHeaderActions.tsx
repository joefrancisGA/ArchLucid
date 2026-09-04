"use client";

import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  BILLING_HELP_ACTION_REFRESH,
  BILLING_HELP_ACTION_REFRESHING,
} from "@/lib/billing-help-guide-content";

type HelpBillingAndPlansHeaderActionsProps = {
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
};

/** Header actions for `/help/billing-and-plans` (HBX). */
export function HelpBillingAndPlansHeaderActions(
  props: HelpBillingAndPlansHeaderActionsProps,
): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-billing-header-actions">
      {!buyerPolishedShell ? <PageContextualHelpButton /> : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="help-billing-refresh-button"
        disabled={props.refreshing}
        onClick={() => void props.onRefresh()}
      >
        {props.refreshing ? BILLING_HELP_ACTION_REFRESHING : BILLING_HELP_ACTION_REFRESH}
      </Button>
    </div>
  );
}
