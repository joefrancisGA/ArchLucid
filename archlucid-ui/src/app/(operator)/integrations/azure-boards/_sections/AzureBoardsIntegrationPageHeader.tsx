"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { INTEGRATIONS_AZURE_BOARDS_PATH } from "@/lib/integrations-nav-paths";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RefreshButton } from "@/components/ui/refresh-button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  operatorFreshnessMetadataWithClockLabel,
} from "@/lib/operator/operator-last-refreshed-label";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import {
  AZURE_BOARDS_ACTION_REFRESHING,
  AZURE_BOARDS_LAST_REFRESHED_PREFIX,
  AZURE_BOARDS_PAGE_SUBTITLE,
  AZURE_BOARDS_PAGE_TITLE,
  AZURE_BOARDS_READINESS_LINK_LABEL,
} from "@/lib/azure-boards-page-copy";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";

export type AzureBoardsIntegrationPageHeaderProps = {
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
};

/** Shared `/integrations/azure-boards` hero — title, lead, contextual help, refresh, and readiness shortcut. */
export function AzureBoardsIntegrationPageHeader(
  props: AzureBoardsIntegrationPageHeaderProps,
): React.JSX.Element {
  const freshnessLabel = props.refreshing
    ? AZURE_BOARDS_ACTION_REFRESHING
    : operatorFreshnessMetadataWithClockLabel({
        prefix: AZURE_BOARDS_LAST_REFRESHED_PREFIX,
        lastRefreshedAt: props.lastRefreshedAt,
        refreshingLabel: null,
      });

  return (
    <OperatorPageHeader
      navHref={INTEGRATIONS_AZURE_BOARDS_PATH}
      title={AZURE_BOARDS_PAGE_TITLE}
      titleTestId="azure-boards-page-title"
      subtitle={AZURE_BOARDS_PAGE_SUBTITLE}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="azure-boards-header-actions">
          <PageContextualHelpButton />
          <RefreshButton
            data-testid="azure-boards-refresh-button"
            busy={props.refreshing}
            onClick={() => void props.onRefresh()}
          />
          <Link
            href={INTEGRATIONS_READINESS_PATH}
            className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.micro)}
            data-testid="azure-boards-readiness-link"
          >
            {AZURE_BOARDS_READINESS_LINK_LABEL}
          </Link>
        </div>
      }
      metadata={
        <OperatorPageFreshnessMetadata
          testId="azure-boards-last-refreshed"
          lastRefreshedAt={props.refreshing ? null : props.lastRefreshedAt}
        >
          {freshnessLabel}
        </OperatorPageFreshnessMetadata>
      }
    />
  );
}
