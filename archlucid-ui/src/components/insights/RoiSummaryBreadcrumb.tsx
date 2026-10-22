import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { OPERATOR_NAV_GROUP_LABELS } from "@/lib/i18n";
import { ROI_SUMMARY_PAGE_TITLE } from "@/lib/roi-summary-page-copy";
import { SPONSOR_REPORT_PAGE_TITLE, SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

/** Insights trail for the ROI summary value-report surface (SPR). */
export function RoiSummaryBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="roi-summary-breadcrumb"
      items={[
        { label: OPERATOR_NAV_GROUP_LABELS.analysis, href: EVIDENCE_GRAPH_PATH },
        { label: SPONSOR_REPORT_PAGE_TITLE, href: SPONSOR_REPORT_PATH },
        { label: ROI_SUMMARY_PAGE_TITLE },
      ]}
    />
  );
}
