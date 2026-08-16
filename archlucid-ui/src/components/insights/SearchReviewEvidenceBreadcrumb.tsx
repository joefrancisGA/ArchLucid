import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { OPERATOR_NAV_GROUP_LABELS } from "@/lib/i18n";
import { EVIDENCE_TRAIL_SEARCH } from "@/lib/search-surface-disambiguation";

/** Insights trail for Search review evidence (SXX). */
export function SearchReviewEvidenceBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="search-review-evidence-breadcrumb"
      items={[
        { label: OPERATOR_NAV_GROUP_LABELS.analysis, href: EVIDENCE_GRAPH_PATH },
        { label: EVIDENCE_TRAIL_SEARCH.title },
      ]}
    />
  );
}
