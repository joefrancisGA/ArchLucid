"use client";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  operatorLastRefreshedExactLabel,
  operatorLastRefreshedLabel,
} from "@/lib/operator-last-refreshed-label";
import {
  BILLING_HELP_ACTION_REFRESH,
  BILLING_HELP_ACTION_REFRESHING,
  BILLING_HELP_LAST_REFRESHED_PREFIX,
  BILLING_HELP_PAGE_TITLE,
} from "@/lib/billing-help-guide-content";

export type HelpBillingAndPlansPageHeaderProps = {
  readonly subtitle: string;
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
};

/** Shared `/help/billing-and-plans` hero — title, lead, contextual help, refresh, and last-refreshed metadata. */
export function HelpBillingAndPlansPageHeader(props: HelpBillingAndPlansPageHeaderProps): React.JSX.Element {
  const lastRefreshedLabel = operatorLastRefreshedLabel(props.lastRefreshedAt);

  return (
    <OperatorPageHeader
      title={BILLING_HELP_PAGE_TITLE}
      titleTestId="help-billing-page-title"
      subtitle={props.subtitle}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="help-billing-header-actions">
          <PageContextualHelpButton />
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
      }
      metadata={
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="help-billing-last-refreshed"
          title={operatorLastRefreshedExactLabel(props.lastRefreshedAt)}
        >
          {BILLING_HELP_LAST_REFRESHED_PREFIX}: {props.refreshing ? BILLING_HELP_ACTION_REFRESHING : lastRefreshedLabel}
        </span>
      }
    />
  );
}
