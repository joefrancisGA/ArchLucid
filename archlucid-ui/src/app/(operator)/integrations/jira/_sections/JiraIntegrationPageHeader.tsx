"use client";

import Link from "next/link";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTEGRATIONS_JIRA_PATH, INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { itsmConnectionStatusTagKind } from "@/lib/itsm/itsm-connection-status-tag-kind";
import {
  JIRA_ACTION_REFRESHING,
  JIRA_BREADCRUMB_INTEGRATIONS_LABEL,
  JIRA_CONNECT_WITH_ATLASSIAN_LABEL,
  JIRA_CONNECT_WITH_ATLASSIAN_PENDING,
  JIRA_INTEGRATION_PAGE_TITLE,
  JIRA_LAST_CHECKED_PREFIX,
  JIRA_PAGE_SUBTITLE,
  JIRA_READINESS_LINK_LABEL,
} from "@/lib/jira-integration-page-copy";
import type {
  JiraAtlassianOAuthConnectGate,
  JiraConnectionStatusPresentation,
} from "@/lib/jira-integration-present";
import { operatorLastRefreshedExactLabel } from "@/lib/operator/operator-last-refreshed-label";
import { cn } from "@/lib/utils";

export type JiraIntegrationPageHeaderProps = {
  readonly connectionStatus: JiraConnectionStatusPresentation;
  readonly refreshing: boolean;
  readonly lastCheckedAt: Date | null;
  readonly onRefresh: () => void;
  readonly onConnectWithAtlassian: () => void;
  readonly connectGate: JiraAtlassianOAuthConnectGate;
  readonly isConnecting: boolean;
};

export function JiraIntegrationPageHeader(props: JiraIntegrationPageHeaderProps): React.JSX.Element {
  return (
    <OperatorPageHeader
      title={JIRA_INTEGRATION_PAGE_TITLE}
      titleTestId="jira-page-title"
      navHref={INTEGRATIONS_JIRA_PATH}
      headingLevel="h1"
      subtitle={JIRA_PAGE_SUBTITLE}
      statusBadge={
        <StatusTag
          kind={itsmConnectionStatusTagKind(props.connectionStatus.status)}
          label={props.connectionStatus.label}
          data-testid="jira-header-status-badge"
        />
      }
      breadcrumb={
        <OperatorPageBreadcrumb
          data-testid="jira-page-breadcrumb"
          items={[
            { label: JIRA_BREADCRUMB_INTEGRATIONS_LABEL },
            { label: JIRA_INTEGRATION_PAGE_TITLE, href: INTEGRATIONS_JIRA_PATH },
          ]}
        />
      }
      actions={
        <div className="flex flex-col items-end gap-2" data-testid="jira-header-actions">
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton />
            <Button
              type="button"
              variant="primary"
              size="sm"
              data-testid="jira-connect-with-atlassian-button"
              disabled={!props.connectGate.allowed}
              onClick={() => void props.onConnectWithAtlassian()}
            >
              {props.isConnecting ? JIRA_CONNECT_WITH_ATLASSIAN_PENDING : JIRA_CONNECT_WITH_ATLASSIAN_LABEL}
            </Button>
            <RefreshButton
              data-testid="jira-refresh-button"
              busy={props.refreshing}
              onClick={() => void props.onRefresh()}
            />
            <Link
              href={INTEGRATIONS_READINESS_PATH}
              className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.micro)}
              data-testid="jira-readiness-link"
            >
              {JIRA_READINESS_LINK_LABEL}
            </Link>
          </div>
          <WhyDisabledCtaHint
            reason={props.connectGate.reason}
            testId="jira-connect-with-atlassian-disabled-helper"
            className="max-w-md text-right"
          />
        </div>
      }
      metadata={
        props.lastCheckedAt !== null ? (
          <span
            className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="jira-last-checked"
          >
            {JIRA_LAST_CHECKED_PREFIX}:{" "}
            <time dateTime={props.lastCheckedAt.toISOString()} title={operatorLastRefreshedExactLabel(props.lastCheckedAt)}>
              {props.refreshing ? JIRA_ACTION_REFRESHING : props.lastCheckedAt.toLocaleString()}
            </time>
          </span>
        ) : null
      }
    />
  );
}
