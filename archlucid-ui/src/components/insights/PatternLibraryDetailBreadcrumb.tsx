import {
  OperatorPageBreadcrumb,
  type OperatorPageBreadcrumbItem,
} from "@/components/operator/OperatorPageBreadcrumb";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { OPERATOR_NAV_GROUP_LABELS } from "@/lib/i18n";
import { PATTERN_LIBRARY_DETAIL_PAGE_TITLE, PATTERN_LIBRARY_PAGE_TITLE } from "@/lib/pattern-library-copy";
import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";

export type PatternLibraryDetailBreadcrumbProps = {
  readonly patternLabel?: string | null;
};

/** Insights trail for a single pattern detail surface (INA). */
export function PatternLibraryDetailBreadcrumb(
  props: PatternLibraryDetailBreadcrumbProps,
): React.JSX.Element {
  const trailingLabel = (props.patternLabel ?? "").trim() || PATTERN_LIBRARY_DETAIL_PAGE_TITLE;
  const items: OperatorPageBreadcrumbItem[] = [
    { label: OPERATOR_NAV_GROUP_LABELS.analysis, href: EVIDENCE_GRAPH_PATH },
    { label: PATTERN_LIBRARY_PAGE_TITLE, href: PATTERN_LIBRARY_PATH },
    { label: trailingLabel },
  ];

  return (
    <OperatorPageBreadcrumb
      data-testid="pattern-library-detail-breadcrumb"
      items={items}
    />
  );
}
