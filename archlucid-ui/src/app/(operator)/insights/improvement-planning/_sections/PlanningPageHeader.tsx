"use client";

import { ImprovementPlanningBreadcrumb } from "@/components/insights/ImprovementPlanningBreadcrumb";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RefreshButton } from "@/components/ui/refresh-button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { PLANNING_PATH } from "@/lib/planning-route";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import {
  IMPROVEMENT_PLANNING_LAST_UPDATED_PREFIX,
  IMPROVEMENT_PLANNING_PAGE_TITLE,
  IMPROVEMENT_PLANNING_REFRESH_LABEL,
  IMPROVEMENT_PLANNING_REFRESHING_LABEL,
} from "@/lib/planning-page-copy";

export type PlanningPageHeaderProps = {
  readonly subtitle: string;
  readonly refreshing: boolean;
  readonly generatedUtc: string | null;
  readonly onRefresh: () => void;
};

/** Shared `/insights/improvement-planning` hero — title, lead, contextual help, refresh, and freshness metadata. */
export function PlanningPageHeader(props: PlanningPageHeaderProps): React.JSX.Element {
  const lastRefreshedAt = props.generatedUtc !== null ? new Date(props.generatedUtc) : null;
  const freshnessLabel = operatorFreshnessMetadataWithClockLabel({
    prefix: IMPROVEMENT_PLANNING_LAST_UPDATED_PREFIX,
    lastRefreshedAt: props.refreshing ? null : lastRefreshedAt,
    refreshingLabel: props.refreshing ? IMPROVEMENT_PLANNING_REFRESHING_LABEL : null,
  });

  return (
    <OperatorPageHeader
      navHref={PLANNING_PATH}
      title={IMPROVEMENT_PLANNING_PAGE_TITLE}
      titleTestId="planning-page-title"
      subtitle={props.subtitle}
      breadcrumb={<ImprovementPlanningBreadcrumb />}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="planning-header-actions">
          <PageContextualHelpButton />
          <RefreshButton
            busy={props.refreshing}
            label={IMPROVEMENT_PLANNING_REFRESH_LABEL}
            data-testid="planning-refresh-button"
            onClick={() => void props.onRefresh()}
          />
        </div>
      }
      metadata={
        <OperatorPageFreshnessMetadata testId="planning-last-updated" lastRefreshedAt={lastRefreshedAt}>
          {freshnessLabel}
        </OperatorPageFreshnessMetadata>
      }
    />
  );
}
