import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { SIGNED_RECORDS_LIST_PAGE_TITLE } from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-copy";
import { getArtifactDisplayLabel } from "@/lib/artifact-review-helpers";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { signedRecordDetailPath, SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

export type GovernanceSealedRecordArtifactBreadcrumbProps = {
  readonly manifestId: string;
  readonly artifactId: string;
  readonly artifactType: string;
  readonly runId: string | null;
};

/** Governance trail for manifest-scoped artifact preview (GAR). */
export function GovernanceSealedRecordArtifactBreadcrumb(
  props: GovernanceSealedRecordArtifactBreadcrumbProps,
): React.JSX.Element {
  const artifactLabel = getArtifactDisplayLabel({
    artifactId: props.artifactId,
    artifactType: props.artifactType,
  });

  const items = [
    { label: "Governance", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
    { label: SIGNED_RECORDS_LIST_PAGE_TITLE, href: SIGNED_RECORDS_LIST_PATH },
    { label: "Sealed record", href: signedRecordDetailPath(props.manifestId) },
  ];

  if (props.runId !== null && props.runId.trim().length > 0) {
    items.push({ label: "Open review", href: reviewDetailPath(props.runId) });
  }

  items.push({ label: artifactLabel });

  return (
    <OperatorPageBreadcrumb
      data-testid="governance-sealed-record-artifact-breadcrumb"
      items={items}
    />
  );
}
