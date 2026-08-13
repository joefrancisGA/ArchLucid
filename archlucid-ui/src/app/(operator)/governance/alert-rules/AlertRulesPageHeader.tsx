"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AlertRulesHubTabId } from "@/lib/alerts-hub-tab";
import type { AlertRulesConfigChange } from "@/lib/alert-rules-config-change";
import { ALERT_RULES_CONFIG_NEVER_CONFIGURED_LABEL } from "@/lib/alert-rule-conditions-copy";
import { formatAlertRoutingConfigProvenanceLine } from "@/lib/alert-routing-presentation";
import {
  COMPOSITE_RULES_CONFIG_NEVER_CONFIGURED_LABEL,
} from "@/lib/enterprise-controls-context-copy";
import {
  operatorFreshnessMetadataLabel,
  operatorLastRefreshedExactLabel,
} from "@/lib/operator/operator-last-refreshed-label";
import {
  ALERTS_CONFIGURATION_ACTION_REFRESHING,
  ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_HREF,
  ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_LABEL,
  ALERTS_CONFIGURATION_LAST_REFRESHED_PREFIX,
  ALERTS_CONFIGURATION_PAGE_TITLE,
} from "@/lib/alerts-page-copy";
import { GOVERNANCE_ALERT_RULES_PATH, GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export type AlertRulesPageHeaderProps = {
  readonly subtitle: string;
  readonly activeTab: AlertRulesHubTabId;
  readonly activeTabLabel: string;
  readonly rulesTabCount: number | undefined;
  readonly rulesConfigChange: AlertRulesConfigChange | null;
  readonly advancedRulesTabCount: number | undefined;
  readonly compositeRulesConfigChange: AlertRulesConfigChange | null;
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
};

function alertRulesTabConfigProvenanceMetadata(props: {
  readonly tabCount: number | undefined;
  readonly configChange: AlertRulesConfigChange | null;
  readonly neverConfiguredLabel: string;
  readonly testId: string;
}): React.JSX.Element | null {
  if (props.tabCount === undefined) {
    return null;
  }

  if (props.tabCount === 0) {
    return (
      <span
        className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid={props.testId}
      >
        {props.neverConfiguredLabel}{" "}
        <Link href={GOVERNANCE_AUDIT_PATH} className={OPERATOR_LINK.inline}>
          View audit trail
        </Link>
      </span>
    );
  }

  const provenanceLine = formatAlertRoutingConfigProvenanceLine(
    props.configChange?.recordedUtc ?? null,
    props.configChange?.actor ?? null,
  );

  if (provenanceLine === null) {
    return null;
  }

  return (
    <span
      className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid={props.testId}
    >
      {provenanceLine}{" "}
      <Link href={GOVERNANCE_AUDIT_PATH} className={OPERATOR_LINK.inline}>
        View audit trail
      </Link>
    </span>
  );
}

function alertRulesConfigProvenanceMetadata(props: AlertRulesPageHeaderProps): React.JSX.Element | null {
  if (props.activeTab === "rules") {
    return alertRulesTabConfigProvenanceMetadata({
      tabCount: props.rulesTabCount,
      configChange: props.rulesConfigChange,
      neverConfiguredLabel: ALERT_RULES_CONFIG_NEVER_CONFIGURED_LABEL,
      testId: "alert-rules-config-provenance",
    });
  }

  if (props.activeTab === "advanced-rules") {
    return alertRulesTabConfigProvenanceMetadata({
      tabCount: props.advancedRulesTabCount,
      configChange: props.compositeRulesConfigChange,
      neverConfiguredLabel: COMPOSITE_RULES_CONFIG_NEVER_CONFIGURED_LABEL,
      testId: "composite-rules-config-provenance",
    });
  }

  return null;
}

function alertRulesHeaderMetadata(props: AlertRulesPageHeaderProps): React.JSX.Element | null {
  const configProvenance = alertRulesConfigProvenanceMetadata(props);

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

  if (configProvenance !== null) {
    return configProvenance;
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
  return (
    <OperatorPageHeader
      navHref={GOVERNANCE_ALERT_RULES_PATH}
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
            { label: ALERTS_CONFIGURATION_PAGE_TITLE, href: GOVERNANCE_ALERT_RULES_PATH },
            { label: props.activeTabLabel },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="alert-rules-header-actions">
          <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
          <RefreshButton
            busy={props.refreshing}
            data-testid="alert-rules-refresh-button"
            onClick={() => void props.onRefresh()}
          />
        </div>
      }
      metadata={alertRulesHeaderMetadata(props)}
    />
  );
}
