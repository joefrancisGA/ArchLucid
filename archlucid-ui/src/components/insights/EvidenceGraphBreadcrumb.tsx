import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { EVIDENCE_GRAPH_PAGE_TITLE } from "@/lib/evidence-graph-page";
import { OPERATOR_NAV_GROUP_LABELS } from "@/lib/i18n";

/** Insights trail for the Evidence graph hub (GRA). */
export function EvidenceGraphBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="evidence-graph-breadcrumb"
      items={[
        { label: OPERATOR_NAV_GROUP_LABELS.analysis },
        { label: EVIDENCE_GRAPH_PAGE_TITLE },
      ]}
    />
  );
}
