"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { OperatorPageBreadcrumb } from "@/components/OperatorPageBreadcrumb";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  operatorFreshnessMetadataLabel,
  operatorLastRefreshedExactLabel,
} from "@/lib/operator/operator-last-refreshed-label";
import {
  ALERTS_CONFIGURATION_ACTION_REFRESH,
  ALERTS_CONFIGURATION_ACTION_REFRESHING,
  ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_HREF,
  ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_LABEL,
  ALERTS_CONFIGURATION_LAST_REFRESHED_PREFIX,
  ALERTS_CONFIGURATION_PAGE_TITLE,
  ALERTS_OPEN_INBOX_LINK_HREF,
  ALERTS_OPEN_INBOX_LINK_LABEL,
} from "@/lib/alerts-page-copy";

export type AlertRulesPageHeaderProps = {
  readonly subtitle: string;
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
};

/** Shared `/governance/alert-rules` hero — title, lead, contextual help, refresh, and inbox shortcut. */
export function AlertRulesPageHeader(props: AlertRulesPageHeaderProps): React.JSX.Element {
  const freshnessLabel = operatorFreshnessMetadataLabel({
    prefix: ALERTS_CONFIGURATION_LAST_REFRESHED_PREFIX,
    lastRefreshedAt: props.lastRefreshedAt,
    refreshingLabel: props.refreshing ? ALERTS_CONFIGURATION_ACTION_REFRESHING : null,
  });

  return (
    <OperatorPageHeader
      title={ALERTS_CONFIGURATION_PAGE_TITLE}
      titleTestId="alert-rules-page-title"
      subtitle={props.subtitle}
      breadcrumb={
        <OperatorPageBreadcrumb
          data-testid="alert-rules-page-breadcrumb"
          items={[
            {
              label: ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_LABEL,
              href: ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_HREF,
            },
            { label: ALERTS_CONFIGURATION_PAGE_TITLE },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="alert-rules-header-actions">
          <PageContextualHelpButton />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="alert-rules-refresh-button"
            disabled={props.refreshing}
            onClick={() => void props.onRefresh()}
          >
            {props.refreshing ? ALERTS_CONFIGURATION_ACTION_REFRESHING : ALERTS_CONFIGURATION_ACTION_REFRESH}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
            data-testid="alert-rules-open-inbox-link"
          >
            <Link href={ALERTS_OPEN_INBOX_LINK_HREF}>{ALERTS_OPEN_INBOX_LINK_LABEL}</Link>
          </Button>
        </div>
      }
      metadata={
        <span
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="alert-rules-last-refreshed"
          title={operatorLastRefreshedExactLabel(props.lastRefreshedAt)}
        >
          {freshnessLabel}
        </span>
      }
    />
  );
}
