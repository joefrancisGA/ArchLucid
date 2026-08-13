"use client";

import Link from "next/link";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTEGRATIONS_READINESS_PATH, INTEGRATIONS_SLACK_PATH } from "@/lib/integrations-nav-paths";
import { operatorLastRefreshedExactLabel } from "@/lib/operator/operator-last-refreshed-label";
import {
  SLACK_ACTION_REFRESHING,
  SLACK_BREADCRUMB_INTEGRATIONS_LABEL,
  SLACK_INTEGRATION_PAGE_SUBTITLE,
  SLACK_INTEGRATION_PAGE_TITLE,
  SLACK_LAST_CHECKED_PREFIX,
  SLACK_READINESS_LINK_LABEL,
  slackIntegrationConfigurationStatusLabel,
  slackIntegrationConfigurationStatusTagKind,
} from "@/lib/slack-integration-page-copy";
import { cn } from "@/lib/utils";

export type SlackIntegrationPageHeaderProps = {
  readonly activeDestinationCount: number;
  readonly refreshing: boolean;
  readonly refreshDisabled: boolean;
  readonly lastCheckedAt: Date | null;
  readonly onRefresh: () => void;
};

export function SlackIntegrationPageHeader(props: SlackIntegrationPageHeaderProps): React.JSX.Element {
  const statusLabel = props.refreshing
    ? "Loading"
    : slackIntegrationConfigurationStatusLabel(props.activeDestinationCount);
  const statusKind = props.refreshing ? "neutral" : slackIntegrationConfigurationStatusTagKind(props.activeDestinationCount);

  return (
    <OperatorPageHeader
      title={SLACK_INTEGRATION_PAGE_TITLE}
      titleTestId="slack-page-title"
      navHref={INTEGRATIONS_SLACK_PATH}
      headingLevel="h1"
      subtitle={SLACK_INTEGRATION_PAGE_SUBTITLE}
      statusBadge={
        <StatusTag
          kind={statusKind}
          label={statusLabel}
          data-testid="slack-header-status-badge"
        />
      }
      breadcrumb={
        <OperatorPageBreadcrumb
          data-testid="slack-page-breadcrumb"
          items={[
            { label: SLACK_BREADCRUMB_INTEGRATIONS_LABEL },
            { label: SLACK_INTEGRATION_PAGE_TITLE, href: INTEGRATIONS_SLACK_PATH },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="slack-header-actions">
          <PageContextualHelpButton />
          <RefreshButton
            data-testid="slack-refresh-button"
            busy={props.refreshing}
            disabled={props.refreshDisabled}
            onClick={() => void props.onRefresh()}
          />
          <Link
            href={INTEGRATIONS_READINESS_PATH}
            className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.micro)}
            data-testid="slack-readiness-link"
          >
            {SLACK_READINESS_LINK_LABEL}
          </Link>
        </div>
      }
      metadata={
        props.lastCheckedAt !== null ? (
          <span
            className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="slack-last-checked"
          >
            {SLACK_LAST_CHECKED_PREFIX}:{" "}
            <time dateTime={props.lastCheckedAt.toISOString()} aria-label={operatorLastRefreshedExactLabel(props.lastCheckedAt)}>
              {props.refreshing ? SLACK_ACTION_REFRESHING : props.lastCheckedAt.toLocaleString()}
            </time>
          </span>
        ) : null
      }
    />
  );
}
