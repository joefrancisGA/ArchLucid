import {
  OperatorPageBreadcrumb,
  type OperatorPageBreadcrumbItem,
} from "@/components/operator/OperatorPageBreadcrumb";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { OPERATOR_NAV_GROUP_LABELS } from "@/lib/i18n";
import { IMPROVEMENT_PLANNING_PAGE_TITLE } from "@/lib/planning-page-copy";
import { PLANNING_PATH } from "@/lib/planning-route";
import { PLANNING_PLAN_DETAIL_PAGE_TITLE } from "@/lib/planning-plan-detail-evidence-copy";

export type ImprovementPlanningPlanDetailBreadcrumbProps = {
  readonly planLabel?: string | null;
};

/** Insights trail for a single improvement plan detail surface (INL). */
export function ImprovementPlanningPlanDetailBreadcrumb(
  props: ImprovementPlanningPlanDetailBreadcrumbProps,
): React.JSX.Element {
  const trailingLabel = (props.planLabel ?? "").trim() || PLANNING_PLAN_DETAIL_PAGE_TITLE;
  const items: OperatorPageBreadcrumbItem[] = [
    { label: OPERATOR_NAV_GROUP_LABELS.analysis, href: EVIDENCE_GRAPH_PATH },
    { label: IMPROVEMENT_PLANNING_PAGE_TITLE, href: PLANNING_PATH },
    { label: trailingLabel },
  ];

  return (
    <OperatorPageBreadcrumb
      data-testid="improvement-planning-plan-detail-breadcrumb"
      items={items}
    />
  );
}
