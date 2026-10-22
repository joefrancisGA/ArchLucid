import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { OPERATOR_NAV_GROUP_LABELS } from "@/lib/i18n";
import { IMPROVEMENT_PLANNING_PAGE_TITLE } from "@/lib/planning-page-copy";

/** Insights trail for the Improvement planning hub (PLA). */
export function ImprovementPlanningBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="improvement-planning-breadcrumb"
      items={[
        { label: OPERATOR_NAV_GROUP_LABELS.analysis, href: EVIDENCE_GRAPH_PATH },
        { label: IMPROVEMENT_PLANNING_PAGE_TITLE },
      ]}
    />
  );
}
