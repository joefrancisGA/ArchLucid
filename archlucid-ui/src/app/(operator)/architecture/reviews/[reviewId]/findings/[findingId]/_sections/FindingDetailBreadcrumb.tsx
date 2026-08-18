import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";

import { FINDING_DETAIL_BREADCRUMB_FINDINGS_LABEL } from "./finding-detail-page-copy";

export type FindingDetailBreadcrumbProps = {
  readonly reviewFindingsHref: string;
  readonly findingTitle: string;
};

/** Core review trail for finding detail (RRF). */
export function FindingDetailBreadcrumb(props: FindingDetailBreadcrumbProps): React.JSX.Element {
  const findingTitle = props.findingTitle.trim() || "Finding";

  return (
    <OperatorPageBreadcrumb
      data-testid="finding-detail-breadcrumb"
      items={[
        { label: FINDING_DETAIL_BREADCRUMB_FINDINGS_LABEL, href: props.reviewFindingsHref },
        { label: findingTitle },
      ]}
    />
  );
}
