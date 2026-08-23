import { ImprovementPlanningBreadcrumb } from "@/components/insights/ImprovementPlanningBreadcrumb";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { PLANNING_PATH } from "@/lib/planning-route";
import {
  IMPROVEMENT_PLANNING_LOADING_STATUS,
  IMPROVEMENT_PLANNING_PAGE_TITLE,
  planningPageSubtitle,
} from "@/lib/planning-page-copy";

/** Structured navigation shell while the improvement-planning client chunk loads. */
export default function PlanningLoading() {
  return (
    <OperatorPageContainer
      variant="dashboard"
      className={OPERATOR_LAYOUT.sectionStack}
      data-testid="improvement-planning-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <OperatorPageHeader
        navHref={PLANNING_PATH}
        title={IMPROVEMENT_PLANNING_PAGE_TITLE}
        titleTestId="planning-page-title"
        subtitle={planningPageSubtitle(true)}
        breadcrumb={<ImprovementPlanningBreadcrumb />}
      />
      <p className="m-0 text-al-text-secondary">{IMPROVEMENT_PLANNING_LOADING_STATUS}</p>
    </OperatorPageContainer>
  );
}
