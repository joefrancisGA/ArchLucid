"use client";

import { ImprovementPlanningPlanDetailBreadcrumb } from "@/components/insights/ImprovementPlanningPlanDetailBreadcrumb";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RefreshButton } from "@/components/ui/refresh-button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import { planningPlanDetailPath } from "@/lib/planning-route";
import {
  PLANNING_PLAN_DETAIL_LAST_UPDATED_PREFIX,
  PLANNING_PLAN_DETAIL_PAGE_TITLE,
  PLANNING_PLAN_DETAIL_REFRESHING_LABEL,
  PLANNING_PLAN_DETAIL_REFRESH_LABEL,
} from "@/lib/planning-plan-detail-evidence-copy";

export type PlanningPlanDetailPageHeaderProps = {
  readonly subtitle: string;
  readonly planId: string;
  readonly planLabel: string | null;
  readonly createdUtc: string | null;
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
};

/** Shared `/insights/improvement-planning/plans/[planId]` hero — breadcrumb, help, refresh, and created metadata. */
export function PlanningPlanDetailPageHeader(props: PlanningPlanDetailPageHeaderProps): React.JSX.Element {
  const lastRefreshedAt = props.createdUtc !== null ? new Date(props.createdUtc) : null;
  const freshnessLabel = operatorFreshnessMetadataWithClockLabel({
    prefix: PLANNING_PLAN_DETAIL_LAST_UPDATED_PREFIX,
    lastRefreshedAt: props.refreshing ? null : lastRefreshedAt,
    refreshingLabel: props.refreshing ? PLANNING_PLAN_DETAIL_REFRESHING_LABEL : null,
  });

  return (
    <OperatorPageHeader
      navHref={planningPlanDetailPath(props.planId)}
      title={PLANNING_PLAN_DETAIL_PAGE_TITLE}
      titleTestId="planning-plan-detail-title"
      subtitle={props.subtitle}
      breadcrumb={<ImprovementPlanningPlanDetailBreadcrumb planLabel={props.planLabel} />}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="planning-plan-detail-header-actions">
          <PageContextualHelpButton />
          <RefreshButton
            busy={props.refreshing}
            label={PLANNING_PLAN_DETAIL_REFRESH_LABEL}
            data-testid="planning-plan-detail-refresh-button"
            onClick={() => {
              props.onRefresh();
            }}
          />
        </div>
      }
      metadata={
        <OperatorPageFreshnessMetadata testId="planning-plan-detail-created" lastRefreshedAt={lastRefreshedAt}>
          {freshnessLabel}
        </OperatorPageFreshnessMetadata>
      }
    />
  );
}
