import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { OPERATOR_NAV_GROUP_LABELS } from "@/lib/i18n";
import { PATTERN_LIBRARY_PAGE_TITLE } from "@/lib/pattern-library-copy";

/** Insights trail for the Pattern library hub (INP). */
export function PatternLibraryBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="pattern-library-breadcrumb"
      items={[
        { label: OPERATOR_NAV_GROUP_LABELS.analysis, href: EVIDENCE_GRAPH_PATH },
        { label: PATTERN_LIBRARY_PAGE_TITLE },
      ]}
    />
  );
}
