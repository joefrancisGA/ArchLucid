import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { OPERATOR_NAV_GROUP_LABELS } from "@/lib/i18n";
import { REVIEW_SCORECARD_PAGE_TITLE } from "@/lib/pilot-scorecard-present";
import { SPONSOR_REPORT_PAGE_TITLE, SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

/** Insights trail for the architecture scorecard value-report surface (SCX). */
export function ArchitectureScorecardBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="architecture-scorecard-breadcrumb"
      items={[
        { label: OPERATOR_NAV_GROUP_LABELS.analysis, href: EVIDENCE_GRAPH_PATH },
        { label: SPONSOR_REPORT_PAGE_TITLE, href: SPONSOR_REPORT_PATH },
        { label: REVIEW_SCORECARD_PAGE_TITLE },
      ]}
    />
  );
}
