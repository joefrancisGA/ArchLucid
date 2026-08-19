import { ImprovementPlanningPlanDetailBreadcrumb } from "@/components/insights/ImprovementPlanningPlanDetailBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { planningPlanDetailPath } from "@/lib/planning-route";
import {
  PLANNING_PLAN_DETAIL_LOADING_STATUS,
  PLANNING_PLAN_DETAIL_PAGE_TITLE,
  planningPlanDetailPageSubtitle,
} from "@/lib/planning-plan-detail-evidence-copy";

/** Structured navigation shell while the plan-detail client chunk loads. */
export default function PlanningPlanDetailLoading() {
  return (
    <div
      className="max-w-3xl space-y-4"
      data-testid="improvement-planning-plan-detail-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <OperatorPageHeader
        navHref={planningPlanDetailPath("plan")}
        title={PLANNING_PLAN_DETAIL_PAGE_TITLE}
        titleTestId="planning-plan-detail-title"
        subtitle={planningPlanDetailPageSubtitle(true)}
        breadcrumb={<ImprovementPlanningPlanDetailBreadcrumb />}
      />
      <p className="m-0 text-al-text-secondary">{PLANNING_PLAN_DETAIL_LOADING_STATUS}</p>
    </div>
  );
}
