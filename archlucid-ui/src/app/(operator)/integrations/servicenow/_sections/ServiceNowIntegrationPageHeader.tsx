"use client";

import Link from "next/link";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTEGRATIONS_READINESS_PATH, INTEGRATIONS_SERVICENOW_PATH } from "@/lib/integrations-nav-paths";
import { itsmConnectionStatusTagKind } from "@/lib/itsm/itsm-connection-status-tag-kind";
import { operatorLastRefreshedExactLabel } from "@/lib/operator/operator-last-refreshed-label";
import {
  SERVICENOW_ACTION_REFRESHING,
  SERVICENOW_BREADCRUMB_INTEGRATIONS_LABEL,
  SERVICENOW_INTEGRATION_PAGE_TITLE,
  SERVICENOW_LAST_CHECKED_PREFIX,
  SERVICENOW_PAGE_SUBTITLE,
  SERVICENOW_READINESS_LINK_LABEL,
} from "@/lib/servicenow-integration-page-copy";
import type { ServiceNowConnectionStatusPresentation } from "@/lib/servicenow-integration-present";
import { cn } from "@/lib/utils";

export type ServiceNowIntegrationPageHeaderProps = {
  readonly connectionStatus: ServiceNowConnectionStatusPresentation;
  readonly refreshing: boolean;
  readonly refreshDisabled: boolean;
  readonly lastCheckedAt: Date | null;
  readonly onRefresh: () => void;
};

export function ServiceNowIntegrationPageHeader(
  props: ServiceNowIntegrationPageHeaderProps,
): React.JSX.Element {
  return (
    <OperatorPageHeader
      title={SERVICENOW_INTEGRATION_PAGE_TITLE}
      titleTestId="servicenow-page-title"
      navHref={INTEGRATIONS_SERVICENOW_PATH}
      headingLevel="h1"
      subtitle={SERVICENOW_PAGE_SUBTITLE}
      statusBadge={
        <StatusTag
          kind={itsmConnectionStatusTagKind(props.connectionStatus.status)}
          label={props.connectionStatus.label}
          data-testid="servicenow-header-status-badge"
        />
      }
      breadcrumb={
        <OperatorPageBreadcrumb
          data-testid="servicenow-page-breadcrumb"
          items={[
            { label: SERVICENOW_BREADCRUMB_INTEGRATIONS_LABEL },
            { label: SERVICENOW_INTEGRATION_PAGE_TITLE, href: INTEGRATIONS_SERVICENOW_PATH },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="servicenow-header-actions">
          <PageContextualHelpButton />
          <RefreshButton
            data-testid="servicenow-refresh-button"
            busy={props.refreshing}
            disabled={props.refreshDisabled}
            onClick={() => void props.onRefresh()}
          />
          <Link
            href={INTEGRATIONS_READINESS_PATH}
            className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.micro)}
            data-testid="servicenow-readiness-link"
          >
            {SERVICENOW_READINESS_LINK_LABEL}
          </Link>
        </div>
      }
      metadata={
        props.lastCheckedAt !== null ? (
          <span
            className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="servicenow-last-checked"
          >
            {SERVICENOW_LAST_CHECKED_PREFIX}:{" "}
            <time dateTime={props.lastCheckedAt.toISOString()} title={operatorLastRefreshedExactLabel(props.lastCheckedAt)}>
              {props.refreshing ? SERVICENOW_ACTION_REFRESHING : props.lastCheckedAt.toLocaleString()}
            </time>
          </span>
        ) : null
      }
    />
  );
}
