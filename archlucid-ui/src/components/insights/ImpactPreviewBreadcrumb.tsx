import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { IMPACT_PREVIEW_PAGE_TITLE } from "@/lib/impact-preview-page-copy";
import { OPERATOR_NAV_GROUP_LABELS } from "@/lib/i18n";

/** Insights trail for the Impact preview simulation surface (INI). */
export function ImpactPreviewBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="impact-preview-breadcrumb"
      items={[
        { label: OPERATOR_NAV_GROUP_LABELS.analysis, href: EVIDENCE_GRAPH_PATH },
        { label: IMPACT_PREVIEW_PAGE_TITLE },
      ]}
    />
  );
}
