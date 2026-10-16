import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";

import { FINDING_DETAIL_BREADCRUMB_FINDINGS_LABEL } from "./finding-detail-page-copy";

export type FindingDetailBreadcrumbProps = {
  readonly reviewFindingsHref: string;
  readonly findingTitle: string;
};

export function resolveFindingDetailBreadcrumbTitle(findingTitle: string): string {
  return findingTitle.trim().length > 0 ? findingTitle.trim() : "Finding title was not stored.";
}

/** Core review trail for finding detail (RRF). */
export function FindingDetailBreadcrumb(props: FindingDetailBreadcrumbProps): React.JSX.Element {
  const findingTitle = resolveFindingDetailBreadcrumbTitle(props.findingTitle);

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
