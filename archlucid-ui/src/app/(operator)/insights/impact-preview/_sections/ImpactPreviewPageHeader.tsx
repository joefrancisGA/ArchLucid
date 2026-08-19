"use client";

import { ImpactPreviewBreadcrumb } from "@/components/insights/ImpactPreviewBreadcrumb";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RefreshButton } from "@/components/ui/refresh-button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { StatusTag } from "@/components/StatusTag";
import {
  operatorFreshnessMetadataWithClockLabel,
} from "@/lib/operator/operator-last-refreshed-label";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  IMPACT_PREVIEW_ACTION_REFRESHING,
  IMPACT_PREVIEW_LAST_REFRESHED_PREFIX,
  IMPACT_PREVIEW_PAGE_TITLE,
} from "@/lib/impact-preview-page-copy";

export type ImpactPreviewPageHeaderProps = {
  readonly subtitle: string;
  readonly listLoading: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly onRefresh: () => void;
  readonly statusKind?: EnterpriseStatusKind | null;
};

/** Shared `/insights/impact-preview` hero — title, lead, contextual help, refresh, and last-refreshed metadata. */
export function ImpactPreviewPageHeader(props: ImpactPreviewPageHeaderProps): React.JSX.Element {
  const freshnessLabel = props.listLoading
    ? IMPACT_PREVIEW_ACTION_REFRESHING
    : operatorFreshnessMetadataWithClockLabel({
        prefix: IMPACT_PREVIEW_LAST_REFRESHED_PREFIX,
        lastRefreshedAt: props.lastRefreshedAt,
        refreshingLabel: null,
      });

  return (
    <OperatorPageHeader
      navHref={IMPACT_PREVIEW_PATH}
      title={IMPACT_PREVIEW_PAGE_TITLE}
      titleTestId="impact-preview-page-title"
      breadcrumb={<ImpactPreviewBreadcrumb />}
      subtitle={props.subtitle}
      statusBadge={props.statusKind != null ? <StatusTag kind={props.statusKind} /> : null}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="impact-preview-header-actions">
          <PageContextualHelpButton />
          <RefreshButton
            data-testid="impact-preview-refresh-button"
            busy={props.listLoading}
            onClick={() => void props.onRefresh()}
          />
        </div>
      }
      metadata={
        <OperatorPageFreshnessMetadata
          testId="impact-preview-last-refreshed"
          lastRefreshedAt={props.listLoading ? null : props.lastRefreshedAt}
        >
          {freshnessLabel}
        </OperatorPageFreshnessMetadata>
      }
    />
  );
}
