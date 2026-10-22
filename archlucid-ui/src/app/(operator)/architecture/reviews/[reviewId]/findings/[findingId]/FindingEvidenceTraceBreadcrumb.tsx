import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { EVIDENCE_TRACE_PAGE_TITLE } from "@/lib/findings/finding-evidence-navigation";

import { resolveFindingDetailBreadcrumbTitle } from "./_sections/FindingDetailBreadcrumb";

export type FindingEvidenceTraceBreadcrumbProps = {
  readonly findingDetailHref: string;
  readonly findingLabel: string;
};

/** Core review trail for finding evidence-trace (ERU). */
export function FindingEvidenceTraceBreadcrumb(
  props: FindingEvidenceTraceBreadcrumbProps,
): React.JSX.Element {
  const findingLabel = resolveFindingDetailBreadcrumbTitle(props.findingLabel);

  return (
    <OperatorPageBreadcrumb
      data-testid="finding-evidence-trace-breadcrumb"
      items={[
        { label: findingLabel, href: props.findingDetailHref },
        { label: EVIDENCE_TRACE_PAGE_TITLE },
      ]}
    />
  );
}
