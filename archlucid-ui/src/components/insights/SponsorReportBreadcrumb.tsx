import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { SPONSOR_REPORT_PAGE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { OPERATOR_NAV_GROUP_LABELS } from "@/lib/i18n";

/** Insights trail for the merged sponsor report / pilot outcomes surface (IPI). */
export function SponsorReportBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="sponsor-report-breadcrumb"
      items={[
        { label: OPERATOR_NAV_GROUP_LABELS.analysis, href: EVIDENCE_GRAPH_PATH },
        { label: SPONSOR_REPORT_PAGE_TITLE },
      ]}
    />
  );
}
