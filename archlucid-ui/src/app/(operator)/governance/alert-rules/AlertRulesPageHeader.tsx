"use client";

import { RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AlertRulesHubTabId } from "@/lib/alerts-hub-tab";
import { ALERT_RULES_POSTURE_NOT_CONFIGURED_LABEL } from "@/lib/alert-rule-conditions-copy";
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
} from "@/lib/alerts-page-copy";

export type AlertRulesPageHeaderProps = {
  readonly subtitle: string;
  readonly activeTab: AlertRulesHubTabId;
  readonly rulesTabCount: number | undefined;
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
};

function alertRulesHeaderMetadata(props: AlertRulesPageHeaderProps): React.JSX.Element | null {
  if (props.refreshing) {
    return (
      <span
        className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="alert-rules-last-refreshed"
      >
        {ALERTS_CONFIGURATION_ACTION_REFRESHING}
      </span>
    );
  }

  if (props.activeTab === "rules" && props.rulesTabCount === 0) {
    return (
      <StatusTag
        kind="neutral"
        label={ALERT_RULES_POSTURE_NOT_CONFIGURED_LABEL}
        data-testid="alert-rules-posture-tag"
      />
    );
  }

  if (props.lastRefreshedAt === null) {
    return null;
  }

  const freshnessLabel = operatorFreshnessMetadataLabel({
    prefix: ALERTS_CONFIGURATION_LAST_REFRESHED_PREFIX,
    lastRefreshedAt: props.lastRefreshedAt,
    refreshingLabel: null,
  });

  return (
    <span
      className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="alert-rules-last-refreshed"
      title={operatorLastRefreshedExactLabel(props.lastRefreshedAt)}
    >
      {freshnessLabel}
    </span>
  );
}

/** Shared `/governance/alert-rules` hero — title, lead, contextual help, refresh, and posture/freshness metadata. */
export function AlertRulesPageHeader(props: AlertRulesPageHeaderProps): React.JSX.Element {
  const refreshLabel = props.refreshing
    ? ALERTS_CONFIGURATION_ACTION_REFRESHING
    : ALERTS_CONFIGURATION_ACTION_REFRESH;

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
          <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
          <Button
            type="button"
            variant="outline"
            size="icon"
            data-testid="alert-rules-refresh-button"
            disabled={props.refreshing}
            aria-label={refreshLabel}
            onClick={() => void props.onRefresh()}
          >
            <RefreshCw className={cn("h-4 w-4", props.refreshing ? "animate-spin" : "")} aria-hidden />
          </Button>
        </div>
      }
      metadata={alertRulesHeaderMetadata(props)}
    />
  );
}
